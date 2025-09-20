// components/chat/ChatPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { ChatList } from './ChatList';
import { ChatBox } from './ChatBox';
import { socketService } from '@/services/socketService';
import type { Conversation } from '@/types/chat';

export const ChatPage: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (token && !socketService.isConnected()) {
      socketService.initialize(dispatch);
      socketService.connect(token);
    }

    return () => {
      // Don't disconnect here as other components might be using the socket
    };
  }, [token, dispatch]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewConversation = () => {
    // Implement new conversation modal or redirect
    console.log('New conversation requested');
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
  };

  return (
    <div className="h-screen flex">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r bg-white">
        <ChatList
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          selectedConversationId={selectedConversation?.id}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatBox
            conversation={selectedConversation}
            onClose={handleCloseChat}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No conversation selected</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};