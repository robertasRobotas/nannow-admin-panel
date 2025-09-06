export type ChatUserType = {
  id: string;
  firstName: string;
  lastName: string;
  imgUrl: string;
};

export type ChatType = {
  id: string;
  user1Id: string;
  user2Id: string;
  messagesCount: number;
  lastMessageId: string;
  user1: ChatUserType;
  user2: ChatUserType;
  otherUser: ChatUserType;
};

export type ChatMessageType = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  chatId: string;
  isRead: boolean;
};
