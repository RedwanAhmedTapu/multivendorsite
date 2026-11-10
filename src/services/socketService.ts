// services/socketService.ts
import { io, Socket } from 'socket.io-client';

export type ParticipantType = "CUSTOMER" | "VENDOR" | "ADMIN" | "EMPLOYEE" | "DELIVERY";

interface SocketAuth {
  token: string;
  // FIX: renamed from userId/userType. For VENDOR this must be
  // currentVendorId — NOT the logged-in account id — since that's the id
  // used in senderVendorId / ConversationParticipant.vendorId everywhere else.
  participantId: string;
  participantType: ParticipantType;
}

/** The slice of the Redux store the socket follows (auth.accessToken / auth.user). */
export interface SocketAuthSource {
  getState(): any;
  subscribe(listener: () => void): () => void;
}

/** Which account a token belongs to — a change means logout or account switch. */
function accountKeyOf(state: any): { token: string | null; accountKey: string | null } {
  const auth = state?.auth ?? {};
  const user = auth.user ?? null;
  const token: string | null = auth.accessToken ?? null;
  const accountKey = user ? `${String(user.role ?? "").toUpperCase()}:${user.rawId ?? user.id ?? ""}` : null;
  return { token, accountKey };
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private joinedRooms: Set<string> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private participantId: string | null = null;
  private participantType: ParticipantType | null = null;
  // Phase 1 (token lifecycle): the socket hands the server the CURRENT access
  // token on every (re)connect attempt — never the one captured at connect().
  private token: string | null = null;
  private accountKey: string | null = null;
  private authRejected = false;
  private authSource: SocketAuthSource | null = null;
  private unbindAuth: (() => void) | null = null;
  // Phase 2 (idle recovery): asks the app's existing HTTP refresh to run when a
  // handshake is refused; at most once until the next successful connect.
  private requestRefresh: (() => void) | null = null;
  private refreshRequested = false;
  // Phase 3: the token the current connection was authenticated with, and
  // whether the server ended the session (token expiry / user no longer valid).
  private handshakeToken: string | null = null;
  private sessionEnded = false;

  initialize(_dispatch?: any) {}

  /**
   * Follow the auth state (call once with the Redux store; idempotent):
   *   - same account, new token (refresh) → the next handshake uses it; a
   *     socket the server refused for an expired token reconnects once;
   *   - token cleared (logout) or another account → the socket is torn down,
   *     so it never keeps the previous account's server identity.
   * `requestRefresh` (optional) runs the app's token refresh when the server
   * refuses a handshake, so an idle chat recovers without other HTTP traffic.
   */
  bindAuth(source: SocketAuthSource, requestRefresh?: () => void) {
    if (requestRefresh) this.requestRefresh = requestRefresh;
    if (this.authSource === source) return;
    this.unbindAuth?.();
    this.authSource = source;
    let prev = accountKeyOf(source.getState());
    this.unbindAuth = source.subscribe(() => {
      const next = accountKeyOf(source.getState());
      if (next.token === prev.token && next.accountKey === prev.accountKey) return;
      prev = next;
      if (!this.socket) return;
      if (!next.token || next.accountKey !== this.accountKey) {
        this.disconnect();
        return;
      }
      this.token = next.token;
      if (!this.socket.connected && this.authRejected) {
        this.authRejected = false;
        this.socket.connect();
      }
    });
  }

  /** The token the next handshake sends: the store's current one when bound. */
  private currentToken(): string | null {
    if (this.authSource) {
      const now = accountKeyOf(this.authSource.getState());
      return now.accountKey === this.accountKey ? now.token : null;
    }
    return this.token;
  }

  connect({ token, participantId, participantType }: SocketAuth): Socket | null {
    // Never open a socket without a credential (no unauthenticated fallback).
    if (!token) return null;
    const accountKey = this.authSource ? accountKeyOf(this.authSource.getState()).accountKey : `${participantType}:${participantId}`;
    if (
      this.socket &&
      this.accountKey === accountKey &&
      this.participantId === participantId &&
      this.participantType === participantType
    ) {
      // Phase 2: same account — keep this instance (and every listener on it).
      // Revive it only when nothing is (re)connecting; calling connect() on an
      // active socket could send a second CONNECT for the same namespace.
      this.token = token; // unbound use: the next handshake sends the caller's token
      if (!this.socket.connected && !this.socket.active) {
        this.authRejected = false;
        this.socket.connect();
      }
      return this.socket;
    }

    if (this.socket) this.disconnect(); // another account — start clean

    this.participantId = participantId;
    this.participantType = participantType;
    this.token = token;
    this.accountKey = accountKey;
    this.authRejected = false;

    this.socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000',
      {
        // Function form: socket.io-client calls it on EVERY connection attempt,
        // including automatic reconnects, so a refreshed token is always used.
        auth: (cb) => {
          const current = this.currentToken();
          if (!current) {
            // logged out / switched meanwhile: don't retry with a stale credential
            queueMicrotask(() => this.disconnect());
            cb({});
            return;
          }
          this.handshakeToken = current;
          cb({ token: current });
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
      }
    );

    this.registerCoreEvents();
    return this.socket;
  }

  private registerCoreEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.refreshRequested = false;
      console.log('🟢 Socket connected:', this.socket?.id);

      // FIX: identity is now always sent on every connect, with the
      // correct payload shape the backend expects. Previously this was
      // conditional (only on reconnect) and used {userId, conversations} —
      // the server never learned who this socket represents, so it never
      // joined participant:{type}:{id}, which is required for a vendor's
      // inbox to receive live updates while a thread isn't open.
      this.emitIdentityJoin();

      if (this.joinedRooms.size > 0) {
        console.log(`🔄 Re-joining ${this.joinedRooms.size} room(s) after reconnect`);
        this.joinedRooms.forEach((id) => {
          this.socket?.emit('chat:joinConversation', id);
        });
      }

      this.startPresence();
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔴 Socket disconnected:', reason);
      this.stopHeartbeat();
      if (reason === 'io server disconnect' && this.sessionEnded) this.onSessionEnded();
    });

    // Phase 3: the server ends a session when its access token expires or the
    // user is no longer authorized; socket.io-client doesn't reconnect after a
    // server disconnect, so recover here (handled once the disconnect lands).
    this.socket.on('chat:auth_expired', () => {
      this.sessionEnded = true;
    });

    this.socket.on('connect_error', (err) => {
      console.error('⚠️  Socket connect_error:', err.message);
      // The server's auth middleware refused the handshake (expired / invalid
      // token). socket.io-client doesn't retry those; bindAuth reconnects once
      // a refreshed token for the same account arrives.
      if (/unauthorized|forbidden/i.test(err.message)) {
        this.authRejected = true;
        // Idle session: nothing else may refresh the expired token. One request
        // per connect cycle — a refreshed token that is refused too stays down.
        if (this.requestRefresh && !this.refreshRequested) {
          this.refreshRequested = true;
          this.requestRefresh();
        }
      }
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnect attempts reached.');
      }
    });

    // Reconnection gave up: mark the socket inactive (listeners kept) so the
    // next connect() for this account revives the same instance.
    const socket = this.socket;
    socket.io.on('reconnect_failed', () => {
      socket.disconnect();
    });

    this.socket.on('error', (err) => {
      console.error('🚨 Server socket error:', err);
    });
  }

  /** The server ended the session: reconnect with a newer token if the store already has one, else refresh once. */
  private onSessionEnded() {
    this.sessionEnded = false;
    const current = this.currentToken();
    if (current && current !== this.handshakeToken) {
      this.socket?.connect(); // refreshed meanwhile (e.g. by an HTTP 401)
      return;
    }
    this.authRejected = true; // bindAuth reconnects when a refreshed token arrives
    if (this.requestRefresh && !this.refreshRequested) {
      this.refreshRequested = true;
      this.requestRefresh();
    }
  }

  private emitIdentityJoin() {
    if (!this.participantId || !this.participantType) return;
    // Matches backend socket/chat.handler.ts -> socket.on("chat:join")
    this.socket?.emit('chat:join', {
      participantType: this.participantType,
      participantId: this.participantId,
      conversations: Array.from(this.joinedRooms),
    });
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  disconnect() {
    if (this.socket) {
      if (this.participantId) {
        this.socket.emit('presence:offline', this.participantId);
      }
      this.removeAllListeners();
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
    }
    this.joinedRooms.clear();
    this.participantId = null;
    this.participantType = null;
    this.token = null;
    this.accountKey = null;
    this.authRejected = false;
    this.refreshRequested = false;
    this.handshakeToken = null;
    this.sessionEnded = false;
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.removeAllListeners(event);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // FIX: renamed to match backend event names exactly (was 'join_conversation').
  joinConversation(conversationId: string) {
    if (!conversationId || this.joinedRooms.has(conversationId)) return;
    this.joinedRooms.add(conversationId);
    this.socket?.emit('chat:joinConversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    if (!conversationId) return;
    this.joinedRooms.delete(conversationId);
    this.socket?.emit('chat:leaveConversation', conversationId);
  }

  startTyping(conversationId: string) {
    this.socket?.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket?.emit('typing:stop', { conversationId });
  }

  markMessageSeen(conversationId: string, messageId: string) {
    if (!this.participantId || !this.participantType) return;
    this.socket?.emit('message:delivered', {
      conversationId,
      messageId,
      participantId: this.participantId,
      participantType: this.participantType,
    });
  }

  private startPresence() {
    if (!this.participantId) return;
    this.socket?.emit('presence:online', this.participantId);
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('presence:heartbeat', this.participantId);
      } else {
        this.stopHeartbeat();
      }
    }, 60000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendMessage(_conversationId: string, _content: string) {
    console.warn('Direct socket sendMessage is deprecated. Use HTTP RTK mutation.');
  }

  markRead(conversationId: string) {
    console.warn('markRead without messageId is deprecated. Use markMessageSeen.');
  }
}

export const socketService = new SocketService();