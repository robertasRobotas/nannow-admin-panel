export type ReviewType = {
  id: string;
  generalRating: number;
  punctualityRating: number;
  empathyRating: number;
  communicationRating: number;
  cleanlinessRating: number;
  orderId: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  likes: string[];
  dislikes: string[];
  reviewerId: string;
  targetId: string;
  reviewee: {
    id: string;
    firstName: string;
    lastName: string;
    providerId: string;
    imgUrl: string;
  };
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    providerId: string;
    imgUrl: string;
  };
  text: string;
};
