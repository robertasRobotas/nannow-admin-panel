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
  paymentRisk?: PaymentRiskType | null;
};

export type PaymentRiskType = {
  isSuspicious: boolean;
  status?: "OPEN" | "REVIEWED" | "DISMISSED" | "ACKNOWLEDGED" | null;
  acknowledgedAt?: string | null;
  acknowledgedByAdminId?: string | null;
  acknowledgedByAdminName?: string | null;
  score: number;
  matchedRuleIds: string[];
  matchedSignals: string[];
  detectedAt?: string | null;
  detectorVersion?: number;
  userWarningSuppressed?: boolean;
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
  suspiciousMessagesCount?: number;
  isSuspicious?: boolean;
  user1: ChatUserType;
  user2: ChatUserType;
  participants?: ChatUserType[];
  messages?: ChatMessageType[];
  lastMessage?: ChatMessageType | null;
};

export type GetAdminChatsResponse = {
  items: ChatType[];
  total: number;
  pageSize: number;
  startIndex: number;
  hasMore: boolean;
  suspiciousTotal?: number;
};
