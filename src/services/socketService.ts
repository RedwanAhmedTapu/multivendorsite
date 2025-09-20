// services/socketService.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private dispatch: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isInitialized = false;

  initialize(dispatch?: any) {
    this.dispatch = dispatch || null;
    this.isInitialized = true;
  }

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('✅ Already connected');
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    console.log('🔌 Connecting to socket server...');
    this.socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.registerCoreEvents();
    return this.socket;
  }

  private registerCoreEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      console.log('🟢 Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔴 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('⚠️ Connection error:', err.message);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnect attempts reached.');
      }
    });

    this.socket.on('error', (err) => {
      console.error('🚨 Server error:', err);
    });
  }

  // ✅ Socket helpers
  isConnected() {
    return !!this.socket?.connected;
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  // ✅ Messaging
  sendMessage(conversationId: string, content: string) {
    this.socket?.emit('send_message', { conversationId, content });
  }

  // ✅ Conversation
  joinConversation(conversationId: string) {
    this.socket?.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave_conversation', { conversationId });
  }

  // ✅ Typing
  startTyping(conversationId: string) {
    this.socket?.emit('user_typing', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket?.emit('user_stop_typing', { conversationId });
  }

  // ✅ Read
  markRead(conversationId: string) {
    this.socket?.emit('mark_read', { conversationId });
  }
  // ✅ Add this inside the SocketService class
disconnect() {
  if (this.socket) {
    console.log("🔌 Disconnecting socket...");
    this.socket.disconnect();
    this.socket = null;
  }
}

}

export const socketService = new SocketService();
