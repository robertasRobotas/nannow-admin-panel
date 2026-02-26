import { OrderType } from "./Order";

export type Payout = {
  id: string;
  orderId: string;
  paidUserId: string;
  paidStripeAccountId: string;
  paidAmt: number;
  currency: string;
  stripeTransferId?: string | null;
  stripePayoutId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  order?: OrderType;
};

export type GetPayoutsResponse = {
  payouts: Payout[];
  totalCount: number;
  subtotalPaidAmt: number;
};
