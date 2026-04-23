export type OrderStatus =
  | "ALL"
  | "ORDER_CREATED"
  | "PROVIDER_OFFERED_SERVICE"
  | "PROVIDER_ACCEPTED_DIRECT_OFFER"
  | "PROVIDER_REJECTED_DIRECT_OFFER"
  | "BOTH_APPROVED"
  | "PROVIDER_MARKED_AS_SERVICE_IN_PROGRESS"
  | "PROVIDER_MARKED_AS_SERVICE_ENDED"
  | "CANCELED_BY_CLIENT"
  | "CANCELED_BY_PROVIDER"
  | "CANCELED_NOT_PAID_BY_CLIENT"
  | "NOT_STARTED_IN_TIME"
  | "NOT_ENDED_IN_TIME"
  | "CLIENT_ORDER_CREATION_IN_PROCESS";

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
  updatedAt?: string | null;
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
  requiredProvider?: {
    id: string;
    userId: string;
    user: User;
  } | null;
  clientUser: ClientUser;
  // Optional: present on list responses for display/search convenience
  orderPrettyId?: string;
  isProviderIgnoredEndNotification?: boolean;
  isOrderCanceledLessThan12hBeforeStart?: boolean;
  isOrderCanceledLessThan2hBeforeStart?: boolean;
  refundedAt?: string | null;
  refundedAmount?: number | null;
  refundedAmountCents?: number | null;
  isCancelFeePaidToProvider?: boolean;
  cancelFeePaidToProviderAt?: string | null;
  cancelFeeAmount?: number | null;
  cancelFeeAmountCents?: number | null;
  isClosedByAdmin?: boolean;
  closedByAdminId?: string | null;
  providerSelectionReminder1SentAt?: string | null;
  providerSelectionReminder2SentAt?: string | null;
  providerSelectionAutoCancelWarnedAt?: string | null;
  unfinishedOrderReminderLastEmailSentAt?: string | null;
  unfinishedOrderReminderEmailCount?: number | null;
};
