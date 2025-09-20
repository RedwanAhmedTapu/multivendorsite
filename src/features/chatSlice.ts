// features/chatSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from './chatApi';

interface ChatState {
  activeConversation: string | null;
  typingUsers: { [conversationId: string]: string[] };
  onlineUsers: string[];
}

const initialState: ChatState = {
  activeConversation: null,
  typingUsers: {},
  onlineUsers: [],
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversation = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      // This will be handled by RTK Query cache
    },
    updateConversation: (state, action: PayloadAction<Conversation>) => {
      // This will be handled by RTK Query cache
    },
    addTypingUser: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      if (!state.typingUsers[conversationId].includes(userId)) {
        state.typingUsers[conversationId].push(userId);
      }
    },
    removeTypingUser: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload;
      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          id => id !== userId
        );
      }
    },
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
  },
});

export const {
  setActiveConversation,
  addMessage,
  updateConversation,
  addTypingUser,
  removeTypingUser,
  setOnlineUsers,
} = chatSlice.actions;

export default chatSlice.reducer;