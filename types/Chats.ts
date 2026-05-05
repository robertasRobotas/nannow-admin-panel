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
  isEdited?: boolean;
  editedAt?: string | null;
  lastEditedByAdminId?: string | null;
  lastEditedByAdminName?: string | null;
  isModerated?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  chatId: string;
  isRead: boolean;
  readAt?: string | null;
};

export type ChatMessageHistorySnapshot = {
  content?: string | null;
  imageUrl?: string | null;
  isDeleted?: boolean | null;
};

export type ChatMessageHistoryEntry = {
  id: string;
  messageId: string;
  chatId: string;
  action: string;
  adminId?: string | null;
  adminName?: string | null;
  createdAt: string;
  before?: ChatMessageHistorySnapshot | null;
  after?: ChatMessageHistorySnapshot | null;
};

export type ChatType = {
  id: string;
  chatId?: string;
  user1Id?: string;
  user2Id?: string;
  messagesCount?: number;
  lastMessageId?: string;
  lastMessageCreatedAt?: string;
  lastMessageReadAt?: string | null;
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
