// components/chatbox/VendorChatButton.tsx
'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useFindOrCreateConversationMutation } from '@/features/chatApi';
import { Button } from '@/components/ui/button';
import ChatBox from './ChatBox';   // ✅ FIXED (default import)

interface VendorChatButtonProps {
  vendorId: string;
  vendorName: string;
  vendorAvatar?: string;
  productId?: string;
  productName?: string;
}

export const VendorChatButton: React.FC<VendorChatButtonProps> = ({
  vendorId,
  vendorName,
  vendorAvatar,
  productId,
  productName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  const [findOrCreateConversation, { isLoading }] = useFindOrCreateConversationMutation();

  const handleOpenChat = async () => {
    if (!user) return;

    try {
      const conversation = await findOrCreateConversation({
        participantIds: [vendorId],
        participantTypes: ['VENDOR'],
        productId,
        type: productId ? 'PRODUCT_INQUIRY' : 'GENERAL_CHAT',
        title: productName ? `About ${productName}` : `Chat with ${vendorName}`,
      }).unwrap();

      setConversation(conversation);
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to open conversation:', error);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenChat}
        className="flex items-center space-x-2"
        variant="outline"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Chat with Seller</span>
          </>
        )}
      </Button>

      {isOpen && conversation && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatBox
            conversation={conversation}
            onClose={() => {
              setIsOpen(false);
              setConversation(null);
            }}
          />
        </div>
      )}
    </>
  );
};
