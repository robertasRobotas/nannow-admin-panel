export type AdminMessage = {
  id: string;
  text: string;
  senderAdminId: string;
  senderName: string;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
};

export type GetAdminMessagesResponse = {
  items: AdminMessage[];
  total: number;
  startIndex: number;
  pageSize: number;
};
