// tests/chat-socket-auth-lifecycle.test.mjs
//
// Phase 1 — the chat socket's credential lifecycle (src/services/socketService.ts),
// against a REAL Socket.IO server (socket.io from multivendorbackend/node_modules,
// on 127.0.0.1 with an ephemeral port; the test skips if it isn't installed).
// The server's auth middleware stands in for chatSocketAuth: it accepts only
// tokens currently marked valid and records every handshake's token. The
// Redux store is a minimal { getState, subscribe } with the real auth shape.
//   1. initial connection with a valid token;
//   2. access-token refresh, then a transport drop → the reconnect sends the
//      NEW token (it used to resend the one captured at connect());
//   3. an expired token is refused and never retried with itself; a refreshed
//      token for the same account reconnects;
//   4. logout tears the socket down, and nothing reconnects without a token;
//   5. account switch: the previous account's socket is closed before the new
//      account connects — no identity carried over.
// Phase 2 (how the components drive it):
//   6. a refresh landing while the socket is down + the re-render's connect()
//      keeps ONE socket instance, its listeners, and sends one handshake;
//   7. idle session: a refused handshake asks for one refresh and reconnects;
//   8. no refresh loop when the refreshed token is refused as well;
//   9. after reconnection gives up, connect() revives the same socket.
// Phase 3: 10–11. the server ends an established session (chat:auth_expired).
//   node --test tests/chat-socket-auth-lifecycle.test.mjs

import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import http from "node:http";

register("./support/tsx-loader.mjs", import.meta.url);

let SocketIOServer = null;
try {
  ({ Server: SocketIOServer } = createRequire(new URL("../../multivendorbackend/package.json", import.meta.url))("socket.io"));
} catch {
  SocketIOServer = null;
}
const skip = SocketIOServer ? false : "socket.io (server) not found in multivendorbackend/node_modules";

const valid = new Map(); // token → account label
const handshakes = []; // tokens seen by the server, in order
const sockets = new Map(); // server socket id → account
let httpServer;
let io;
let socketService;

before(async () => {
  if (skip) return;
  httpServer = http.createServer();
  io = new SocketIOServer(httpServer);
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    handshakes.push(token ?? null);
    if (!token || !valid.has(token)) return next(new Error("Unauthorized"));
    socket.data.account = valid.get(token);
    next();
  });
  io.on("connection", (s) => {
    sockets.set(s.id, s.data.account);
    s.on("disconnect", () => sockets.delete(s.id));
  });
  await new Promise((r) => httpServer.listen(0, "127.0.0.1", r));
  process.env.NEXT_PUBLIC_SOCKET_URL = `http://127.0.0.1:${httpServer.address().port}`;
  ({ socketService } = await import("../src/services/socketService.ts"));
});
after(async () => {
  if (skip) return;
  socketService.disconnect();
  io.close();
  await new Promise((r) => httpServer.close(r));
});
afterEach(() => {
  if (skip) return;
  socketService.disconnect();
  valid.clear();
  handshakes.length = 0;
});

function store(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    getState: () => state,
    subscribe: (l) => (listeners.add(l), () => listeners.delete(l)),
    set(auth) {
      state = { ...state, auth: { ...state.auth, ...auth } };
      listeners.forEach((l) => l());
    },
  };
}
const user = (id, role = "CUSTOMER") => ({ id, rawId: id, role });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(cond, ms = 2000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (cond()) return true;
    await sleep(20);
  }
  return cond();
}
const live = () => [...sockets.values()];
const clientSocket = () => socketService["socket"];

test("1. initial connection with a valid token", { skip }, async () => {
  valid.set("T1", "A");
  const s = store({ auth: { accessToken: "T1", user: user("U_A") } });
  socketService.bindAuth(s);
  socketService.connect({ token: "T1", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  assert.deepEqual(handshakes, ["T1"]);
  assert.deepEqual(live(), ["A"]);
});

test("2. token refresh, then a transport drop: the reconnect sends the refreshed token", { skip }, async () => {
  valid.set("T1", "A");
  const s = store({ auth: { accessToken: "T1", user: user("U_A") } });
  socketService.bindAuth(s);
  socketService.connect({ token: "T1", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  valid.set("T2", "A");
  s.set({ accessToken: "T2" }); // baseQueryWithReauth's refresh
  valid.delete("T1"); // the old access token has expired
  assert.ok(socketService.isConnected(), "a refresh doesn't drop a working socket");
  clientSocket().io.engine.close(); // network blip → automatic reconnect
  assert.ok(await until(() => handshakes.length === 2 && socketService.isConnected()), JSON.stringify(handshakes));
  assert.deepEqual(handshakes, ["T1", "T2"]);
  assert.deepEqual(live(), ["A"], "one socket, same account — no duplicate");
});

test("3. an expired token is refused and not retried with itself; a refreshed token for the same account reconnects", { skip }, async () => {
  valid.set("T_FRESH", "A");
  const s = store({ auth: { accessToken: "T_EXPIRED", user: user("U_A") } });
  socketService.bindAuth(s);
  socketService.connect({ token: "T_EXPIRED", participantId: "U_A", participantType: "CUSTOMER" });
  await sleep(400);
  assert.equal(socketService.isConnected(), false);
  assert.deepEqual(handshakes, ["T_EXPIRED"], "no retry loop with the refused token");
  assert.deepEqual(live(), []);
  s.set({ accessToken: "T_FRESH" });
  assert.ok(await until(() => socketService.isConnected()));
  assert.deepEqual(handshakes, ["T_EXPIRED", "T_FRESH"]);
  assert.deepEqual(live(), ["A"]);
});

test("4. logout tears the socket down; nothing reconnects without a token", { skip }, async () => {
  valid.set("T1", "A");
  const s = store({ auth: { accessToken: "T1", user: user("U_A") } });
  socketService.bindAuth(s);
  socketService.connect({ token: "T1", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  s.set({ accessToken: null, user: null }); // clearAuth()
  assert.ok(await until(() => live().length === 0), "the server sees the socket close");
  assert.equal(socketService.isConnected(), false);
  assert.equal(socketService.connect({ token: null, participantId: "U_A", participantType: "CUSTOMER" }), null, "no unauthenticated connection");
  await sleep(300);
  assert.deepEqual(handshakes, ["T1"], "no further handshakes after logout");
});

test("5. account switch: the previous account's socket is closed before the new account connects", { skip }, async () => {
  valid.set("TA", "A");
  valid.set("TB", "B");
  const s = store({ auth: { accessToken: "TA", user: user("U_A") } });
  socketService.bindAuth(s);
  socketService.connect({ token: "TA", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  s.set({ accessToken: "TB", user: user("V_B", "VENDOR") }); // logout + login as someone else, same tab
  assert.ok(await until(() => live().length === 0), "A's socket is gone");
  assert.equal(socketService.isConnected(), false);
  socketService.connect({ token: "TB", participantId: "V_B", participantType: "VENDOR" });
  assert.ok(await until(() => socketService.isConnected()));
  assert.deepEqual(live(), ["B"]);
  assert.deepEqual(handshakes, ["TA", "TB"]);
  clientSocket().io.engine.close(); // reconnect keeps B's token, never A's
  assert.ok(await until(() => handshakes.length === 3 && socketService.isConnected()));
  assert.equal(handshakes[2], "TB");
});

// Phase 2 — integration with how the chat components actually drive the service.

test("6. a refresh that lands while the socket is down keeps the same socket and its listeners (the component re-render's connect() doesn't replace it)", { skip }, async () => {
  valid.set("T1", "A");
  const s = store({ auth: { accessToken: "T1", user: user("U_A") } });
  socketService.bindAuth(s);
  socketService.connect({ token: "T1", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  const received = [];
  socketService.on("probe", (v) => received.push(v)); // e.g. ChatList's conversationUpdated (effect deps don't include the token)
  const first = clientSocket();
  valid.delete("T1"); // expired while connected
  first.io.engine.close(); // blip → reconnect with T1 is refused
  assert.ok(await until(() => handshakes.length === 2 && !socketService.isConnected()));
  await sleep(100);
  valid.set("T2", "A");
  s.set({ accessToken: "T2" }); // refresh → bindAuth retries
  // React re-renders with the new token; the effect sees isConnected() === false and calls connect()
  socketService.connect({ token: "T2", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  await sleep(100);
  assert.equal(clientSocket(), first, "same socket instance");
  assert.deepEqual(live(), ["A"], "exactly one server-side socket");
  assert.deepEqual(handshakes, ["T1", "T1", "T2"], "one handshake for the retry — no duplicate CONNECT");
  io.emit("probe", 1);
  assert.ok(await until(() => received.length === 1), "the listener registered before the refresh still fires");
});

test("7. idle session: a handshake refused for an expired token asks for ONE refresh (no HTTP traffic needed) and reconnects with it", { skip }, async () => {
  valid.set("T1", "A");
  const s = store({ auth: { accessToken: "T1", user: user("U_A") } });
  let refreshes = 0;
  let nextToken = "T2";
  socketService.bindAuth(s, () => {
    refreshes++;
    // stands in for the existing baseQueryWithReauth refresh → setAccessToken
    setTimeout(() => {
      valid.set(nextToken, "A");
      s.set({ accessToken: nextToken });
    }, 20);
  });
  socketService.connect({ token: "T1", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  valid.delete("T1"); // the access token expires while the chat sits idle
  clientSocket().io.engine.close(); // laptop sleep / network change
  assert.ok(await until(() => refreshes === 1 && socketService.isConnected(), 4000), `refreshes=${refreshes} ${JSON.stringify(handshakes)}`);
  assert.deepEqual(handshakes, ["T1", "T1", "T2"]);
  assert.deepEqual(live(), ["A"]);
  // a later expiry, after a successful connect, may ask again — once
  valid.delete("T2");
  nextToken = "T3";
  clientSocket().io.engine.close();
  assert.ok(await until(() => refreshes === 2 && socketService.isConnected(), 4000));
  assert.deepEqual(handshakes, ["T1", "T1", "T2", "T2", "T3"]);
});

test("8. no refresh loop: if the refreshed token is refused too, the socket stays down and no further refresh is requested", { skip }, async () => {
  valid.set("T1", "A");
  const s = store({ auth: { accessToken: "T1", user: user("U_A") } });
  let refreshes = 0;
  socketService.bindAuth(s, () => {
    refreshes++;
    setTimeout(() => s.set({ accessToken: `T_REFUSED_${refreshes}` }), 20); // e.g. the server refuses this account
  });
  socketService.connect({ token: "T1", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  valid.delete("T1");
  clientSocket().io.engine.close();
  assert.ok(await until(() => handshakes.length === 3, 3000), JSON.stringify(handshakes)); // first reconnect waits 0.5–1.5 s
  await sleep(1500); // room for a loop to show itself
  assert.equal(refreshes, 1, "exactly one refresh request");
  assert.equal(socketService.isConnected(), false);
  assert.deepEqual(handshakes, ["T1", "T1", "T_REFUSED_1"]);
  assert.deepEqual(live(), []);
});

test("9. after the client gives up reconnecting, the next connect() for the same account revives the same socket", { skip }, async () => {
  valid.set("T1", "A");
  const s = store({ auth: { accessToken: "T1", user: user("U_A") } });
  socketService.bindAuth(s);
  socketService.connect({ token: "T1", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  const first = clientSocket();
  const received = [];
  socketService.on("probe", (v) => received.push(v));
  // simulate exhausted reconnection attempts (server unreachable for a while)
  first.io.reconnection(false);
  first.io.engine.close();
  assert.ok(await until(() => !socketService.isConnected()));
  first.io.emitReserved("reconnect_failed");
  first.io.reconnection(true);
  socketService.connect({ token: "T1", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  assert.equal(clientSocket(), first);
  assert.deepEqual(live(), ["A"]);
  io.emit("probe", 1);
  assert.ok(await until(() => received.length === 1));
});

// Phase 3 — the server ends an established session (token expiry, user no longer
// authorized): it emits chat:auth_expired, then disconnects the socket.
const endSession = () => {
  for (const s of io.sockets.sockets.values()) {
    s.emit("chat:auth_expired");
    s.disconnect(true);
  }
};

test("10. server ends the session; the store already has a newer token → reconnect with it, same socket, listeners kept, no refresh", { skip }, async () => {
  valid.set("T1", "A");
  const s = store({ auth: { accessToken: "T1", user: user("U_A") } });
  let refreshes = 0;
  socketService.bindAuth(s, () => refreshes++);
  socketService.connect({ token: "T1", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  const first = clientSocket();
  const received = [];
  socketService.on("probe", (v) => received.push(v));
  valid.set("T2", "A");
  s.set({ accessToken: "T2" }); // refreshed by an HTTP 401 while connected
  valid.delete("T1");
  endSession(); // the server's timer for T1's exp
  assert.ok(await until(() => handshakes.length === 2 && socketService.isConnected()), JSON.stringify(handshakes));
  assert.deepEqual(handshakes, ["T1", "T2"]);
  assert.equal(refreshes, 0);
  assert.equal(clientSocket(), first);
  assert.deepEqual(live(), ["A"]);
  io.emit("probe", 1);
  assert.ok(await until(() => received.length === 1));
});

test("11. server ends the session with the current token → ONE refresh, reconnect with the new token; refused again → stays down, no loop", { skip }, async () => {
  valid.set("T1", "A");
  const s = store({ auth: { accessToken: "T1", user: user("U_A") } });
  let refreshes = 0;
  let next = "T2";
  socketService.bindAuth(s, () => {
    refreshes++;
    setTimeout(() => {
      if (next) valid.set(next, "A");
      s.set({ accessToken: next ?? "T_REFUSED" });
    }, 20);
  });
  socketService.connect({ token: "T1", participantId: "U_A", participantType: "CUSTOMER" });
  assert.ok(await until(() => socketService.isConnected()));
  valid.delete("T1");
  endSession();
  assert.ok(await until(() => refreshes === 1 && socketService.isConnected()), `refreshes=${refreshes} ${JSON.stringify(handshakes)}`);
  assert.deepEqual(handshakes, ["T1", "T2"]);
  // deactivated: the refresh still returns a token, but the server refuses it
  next = null;
  valid.delete("T2");
  endSession();
  assert.ok(await until(() => handshakes.length === 3));
  await sleep(1500);
  assert.equal(refreshes, 2, "one refresh for this session end, none for the refused handshake");
  assert.equal(socketService.isConnected(), false);
  assert.deepEqual(handshakes, ["T1", "T2", "T_REFUSED"]);
});
