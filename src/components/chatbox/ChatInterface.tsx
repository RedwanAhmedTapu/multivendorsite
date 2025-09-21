// components/chat/ChatInterface.tsx
'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useCreateConversationMutation } from '@/features/chatApi';
import { ChatList } from './ChatList';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ChatBox from './ChatBox';

export const ChatInterface: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const [createConversation] = useCreateConversationMutation();

  const handleNewConversation = async (data: {
    participantId: string;
    participantType: string;
    title: string;
  }) => {
    try {
      const conversation = await createConversation({
        participantIds: [data.participantId],
        participantTypes: [data.participantType as any],
        title: data.title,
        type: 'GENERAL_CHAT'
      }).unwrap();

      setSelectedConversation(conversation);
      setIsNewChatOpen(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 border-r">
        <ChatList
          onSelectConversation={setSelectedConversation}
          onNewConversation={() => setIsNewChatOpen(true)}
        />
      </div>

      <div className="flex-1">
        {selectedConversation ? (
          <ChatBox
            conversation={selectedConversation}
            onClose={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      <NewChatDialog
        open={isNewChatOpen}
        onOpenChange={setIsNewChatOpen}
        onSubmit={handleNewConversation}
      />
    </div>
  );
};

const NewChatDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}> = ({ open, onOpenChange, onSubmit }) => {
  const [formData, setFormData] = useState({
    participantId: '',
    participantType: 'CUSTOMER',
    title: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="participantType">Chat With</Label>
            <Select
              value={formData.participantType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, participantType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participantId">ID</Label>
            <Input
              id="participantId"
              value={formData.participantId}
              onChange={(e) => setFormData(prev => ({ ...prev, participantId: e.target.value }))}
              placeholder="Enter user/vendor ID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Conversation Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter conversation title"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Start Conversation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};