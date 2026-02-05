export type OrderStatus =
  | "ALL"
  | "ORDER_CREATED"
  | "PROVIDER_OFFERED_SERVICE"
  | "PROVIDER_ACCEPTED_DIRECT_OFFER"
  | "BOTH_APPROVED"
  | "PROVIDER_MARKED_AS_SERVICE_IN_PROGRESS"
  | "PROVIDER_MARKED_AS_SERVICE_ENDED"
  | "CLIENT_CANCELED"
  | "PROVIDER_CANCELED"
  | "NOT_STARTED_IN_TIME"
  | "NOT_ENDED_IN_TIME";

export type Rating = {
  generalRating: number;
  punctualityRating: number;
  empathyRating: number;
  communicationRating: number;
  cleanlinessRating: number;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imgUrl: string;
  phoneNumber: string;
};

export type Client = {
  id: string;
  userId: string;
};

export type ApprovedProvider = {
  id: string;
  userId: string;
  rating: Rating;
  positiveReviewsCount: number;
  user: User;
};

export type ClientUser = User & {
  id: string;
};

export type OrderType = {
  id: string;
  startsAt: string; // ISO date
  endsAt: string; // ISO date
  isUrgent: boolean;
  createdAt: string;
  approvedProviderId: string | null;
  totalPrice: number | null;
  subtotalPrice: number | null;
  platformFeePrice: number | null;
  status: OrderStatus;
  paymentStatus: string;
  isDirectOrderToProvider: boolean;
  requiredProviderId: string | null;
  pendingProvidersCount: number;
  client: Client;
  approvedProvider?: ApprovedProvider; // may be missing if not approved
  clientUser: ClientUser;
  // Optional: present on list responses for display/search convenience
  orderPrettyId?: string;
  isProviderIgnoredEndNotification?: boolean;
};
