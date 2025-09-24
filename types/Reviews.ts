export type ReviewType = {
  id: string;
  reviewed_by: {
    name: string;
    imgUrl: string;
  };
  reviewed: {
    name: string;
    imgUrl: string;
  };
  rating: number;
  createdAt: string; // could refine to Date or a stricter format if you want
  review: string;
};
