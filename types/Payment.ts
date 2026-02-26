import { OrderType } from "./Order";

export type Payment = {
  id: string;
  orderId: string;
  paidUserId?: string;
  paidAmt?: number;
  amount?: number;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
  order?: OrderType;
};

export type GetPaymentsResponse = {
  payments?: Payment[];
  payouts?: Payment[];
  totalCount: number;
  subtotalPaidAmt?: number;
  subtotalAmount?: number;
};
