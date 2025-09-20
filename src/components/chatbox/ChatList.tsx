// components/chat/ChatList.tsx
'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetConversationsQuery } from '@/features/chatApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatListProps {
  onSelectConversation: (conversation: any) => void;
  onNewConversation: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  onSelectConversation,
  onNewConversation
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: conversationsData } = useGetConversationsQuery({});

  const conversations = conversationsData?.data || [];

  const getOtherParticipant = (conversation: any) => {
    return conversation.participants.find(
      (p: any) => p.userId !== user?.id && p.vendorId !== user?.id
    );
  };

  const getParticipantName = (participant: any) => {
    if (participant.user) return participant.user.name;
    if (participant.vendor) return participant.vendor.name;
    if (participant.employee) return participant.employee.name;
    if (participant.deliveryPerson) return participant.deliveryPerson.name;
    return 'Unknown';
  };

  const getParticipantAvatar = (participant: any) => {
    if (participant.user) return participant.user.avatar;
    if (participant.vendor) return participant.vendor.avatar;
    if (participant.employee) return participant.employee.avatar;
    if (participant.deliveryPerson) return participant.deliveryPerson.avatar;
    return '/default-avatar.png';
  };

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Messages
          <Button variant="outline" size="sm" onClick={onNewConversation}>
            New Chat
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const participant = getOtherParticipant(conversation);
              return (
                <div
                  key={conversation.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => onSelectConversation(conversation)}
                >
                  <Avatar>
                    <AvatarImage src={getParticipantAvatar(participant)} />
                    <AvatarFallback>
                      {getParticipantName(participant)?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getParticipantName(participant)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};