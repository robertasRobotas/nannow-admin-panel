export interface FeedbackType {
  id: string;
  type: "BUG" | "FEEDBACK";
  userId: string;
  message: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  isResolved: boolean;
  resolvedAt: string | null;
  userEmail: string;
  adminNotes: string[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isEmailVerified: boolean;
    providerId: string;
    imgUrl: string;
    clientId: string;
  };
}
