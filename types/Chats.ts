export type ChatUserType = {
  id: string;
  firstName: string;
  lastName?: string;
  imgUrl: string;
  isVerified?: boolean;
  badgesIds?: string[];
  rating?: number;
  positiveReviewsCount?: number;
};

export type ChatMessageType = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  chatId: string;
  isRead: boolean;
};

export type ChatType = {
  id: string;
  chatId?: string;
  user1Id?: string;
  user2Id?: string;
  messagesCount?: number;
  lastMessageId?: string;
  lastMessageCreatedAt?: string;
  unreadMessagesCount?: number;
  user1: ChatUserType;
  user2: ChatUserType;
  participants?: ChatUserType[];
  messages?: ChatMessageType[];
};

export type GetAdminChatsResponse = {
  items: ChatType[];
  total: number;
  pageSize: number;
  startIndex: number;
  hasMore: boolean;
};
