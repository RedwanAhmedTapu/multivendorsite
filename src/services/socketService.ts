// services/socketService.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts     = 0;
  private maxReconnectAttempts  = 5;
  private joinedRooms: Set<string> = new Set();

  initialize(_dispatch?: any) {}

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    // Clean up any stale socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // ── Send the token exactly as stored in Redux (no "Bearer " prefix) ───────
    // The server's socketAuth strips "Bearer " if present, so either format
    // works — but be consistent. We send it raw here.
    this.socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ?? 'https://api.finixmart.com.bd',
      {
        auth:       { token },          // ← plain token, no "Bearer " prefix
        transports: ['websocket', 'polling'],
        reconnection:         true,
        reconnectionDelay:    1000,
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
      console.log('🟢 Socket connected:', this.socket?.id);

      // Re-join all rooms after reconnect — Socket.IO drops membership on
      // disconnect so we track them ourselves and re-emit on reconnect.
      if (this.joinedRooms.size > 0) {
        console.log(`🔄 Re-joining ${this.joinedRooms.size} room(s) after reconnect`);
        this.joinedRooms.forEach((conversationId) => {
          this.socket?.emit('join_conversation', { conversationId });
        });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔴 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('⚠️  Socket connect_error:', err.message);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnect attempts reached.');
      }
    });

    this.socket.on('error', (err) => {
      console.error('🚨 Server socket error:', err);
    });
  }

  // ── State ──────────────────────────────────────────────────────────────────

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.joinedRooms.clear();
  }

  // ── Listeners ──────────────────────────────────────────────────────────────

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────

  joinConversation(conversationId: string) {
    if (!conversationId) return;
    this.joinedRooms.add(conversationId);
    this.socket?.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string) {
    if (!conversationId) return;
    this.joinedRooms.delete(conversationId);
    this.socket?.emit('leave_conversation', { conversationId });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  markRead(conversationId: string) {
    this.socket?.emit('mark_read', { conversationId });
  }

  startTyping(conversationId: string) {
    this.socket?.emit('user_typing', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket?.emit('user_stop_typing', { conversationId });
  }

  // Primary send path is HTTP (sendMessageMutation).
  // This exists as a fallback / for direct socket clients.
  sendMessage(conversationId: string, content: string) {
    this.socket?.emit('send_message', { conversationId, content });
  }
}

export const socketService = new SocketService();