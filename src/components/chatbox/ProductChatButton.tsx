// components/ProductChatButton.tsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ChatBox from './ChatBox';
import { RootState } from '@/store/store';

interface ProductChatButtonProps {
  productId: string;
  vendorId: string;
  vendorName: string;
}

const ProductChatButton: React.FC<ProductChatButtonProps> = ({
  productId,
  vendorId,
  vendorName
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  // // Don't show button if user is not logged in or is a vendor
  // if (!user || user.role === 'VENDOR') return null;

  return (
    <>
      <button
        onClick={() => setIsChatOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mt-4"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span>Chat with Seller</span>
      </button>

      <ChatBox
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialParticipant={{
          id: vendorId,
          type: 'VENDOR',
          name: vendorName
        }}
        productId={productId}
      />
    </>
  );
};

export default ProductChatButton;