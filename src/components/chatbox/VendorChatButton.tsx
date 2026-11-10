"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import UnifiedChat from "@/components/chatbox/UnifiedChat";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/loginmodal/loginModal";

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
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);

  const isAuthenticated = !!user && !!accessToken;

  const handleButtonClick = () => {
    if (isAuthenticated) {
      setIsChatOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      {/* Always show the button */}
      <Button
        onClick={handleButtonClick}
        className="flex items-center space-x-2"
        variant="outline"
        size="sm"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>Chat</span>
      </Button>

      {/* Show chat only when open AND authenticated */}
      {isChatOpen && isAuthenticated && (
        <div className="fixed bottom-4 right-4 z-50">
          <UnifiedChat
            layout="popup"
            role="USER"
            accessToken={accessToken}
            otherParticipant={{
              id: vendorId,
              type: "VENDOR",
              displayName: vendorName,
              displayImage: vendorAvatar || null,
            }}
            productId={productId}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}

      {/* Login Modal - properly controlled with props */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          // Optionally open chat after successful login
          setIsChatOpen(true);
        }}
        message="Please login to chat with the seller"
      />
    </>
  );
};