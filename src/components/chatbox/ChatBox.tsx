'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useSendMessageMutation } from '@/features/chatApi';
import { socketService } from '@/services/socketService';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X, User } from 'lucide-react';

interface ChatBoxProps {
  conversation: any;
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ conversation, onClose }) => {
  const user = useSelector((s: RootState) => s.auth.user);
  const token = useSelector((s: RootState) => s.auth.accessToken);

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [sendMessageApi] = useSendMessageMutation();

  // Load initial messages
  useEffect(() => {
    if (conversation?.messages?.length) {
      setMessages(
        [...conversation.messages].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
    }
  }, [conversation?.messages]);

  // Connect socket
  useEffect(() => {
    if (!token) return;
    socketService.initialize();
    socketService.connect(token);
    return () => socketService.disconnect();
  }, [token]);

  // Join conversation socket room
  useEffect(() => {
    if (!conversation?.id) return;

    socketService.joinConversation(conversation.id);

    const handleNewMessage = (m: any) => {
      if (m.conversationId !== conversation.id) return;
      setMessages((prev) => {
        const exists = prev.find((msg) => msg.id === m.id);
        if (exists) return prev;
        return [...prev, m].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    };

    socketService.on('new_message', handleNewMessage);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.leaveConversation(conversation.id);
    };
  }, [conversation?.id]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!messageText.trim() || !conversation?.id) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      conversationId: conversation.id,
      content: messageText.trim(),
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      status: 'SENT',
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessageText('');

    try {
      const res = await sendMessageApi({
        conversationId: conversation.id,
        content: optimistic.content,
      }).unwrap();

      setMessages((prev) =>
        prev.map((msg) => (msg.id === optimisticId ? res : msg))
      );
    } catch {
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
      setMessageText(optimistic.content);
    }
  };

  const formatTime = (dateString: string) =>
    format(new Date(dateString), 'hh:mm a');

  // Get vendor participant (excluding current user)
  const vendor = conversation?.participants?.find(
    (p: any) => p.id !== user?.id
  ) || {
    name: 'Vendor',
    avatar: '',
    online: false,
  };

  return (
    <div className="w-96 h-[500px] bg-white shadow-lg rounded-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            {vendor.avatar ? (
              <AvatarImage src={vendor.avatar} alt={vendor.name} />
            ) : (
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="font-medium">{vendor.name}</h3>
            <p className="text-xs text-gray-500">
              {vendor.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages with custom scrollbar */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
      >
        {messages.map((msg, idx) => {
          const isSender = msg.senderId === user?.id;
          const showAvatar = !isSender && (
            idx === 0 || messages[idx - 1].senderId !== msg.senderId
          );

          return (
            <div
              key={msg.id}
              className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-3`}
            >
              {!isSender && (
                <div className="flex items-end">
                  {showAvatar ? (
                    <Avatar className="w-8 h-8 mr-2">
                      {vendor.avatar ? (
                        <AvatarImage src={vendor.avatar} alt={vendor.name} />
                      ) : (
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ) : (
                    <div className="w-8 h-8 mr-2" /> // Spacer for alignment
                  )}
                </div>
              )}

              <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} max-w-[70%]`}>
                <div
                  className={`px-3 py-2 rounded-lg break-words ${
                    isSender
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                  style={{ 
                    maxWidth: '100%',
                    wordWrap: 'break-word'
                  }}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>

              {isSender && (
                <div className="flex items-end ml-2">
                  <Avatar className="w-8 h-8">
                    {user?.avatar ? (
                      <AvatarImage src={user?.avatar} alt={user.name} />
                    ) : (
                      <AvatarFallback>
                        {user?.name?.charAt(0) || 'you'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <Input
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button onClick={handleSend}>Send</Button>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
        }
        .scrollbar-thumb-gray-400::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default ChatBox;