// types/chat.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'EMPLOYEE' | 'DELIVERY';
  online?: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  read: boolean;
  sender?: User;
}

export interface Conversation {
  id: string;
  type: 'PRODUCT_INQUIRY' | 'VENDOR_SUPPORT' | 'USER_SUPPORT' | 'DELIVERY_CHAT' | 'GENERAL_CHAT';
  title?: string;
  productId?: string;
  orderId?: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  lastMessage?: Message;
  unreadCount: number;
  participants: ConversationParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId?: string;
  vendorId?: string;
  employeeId?: string;
  deliveryPersonId?: string;
  participantType: string;
  user?: User;
  vendor?: User;
  employee?: User;
  deliveryPerson?: User;
}