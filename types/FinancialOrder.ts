export type FinancialOrderMode = "FORECAST" | "PARTIAL_REAL" | "REAL";

export type FinancialOrderRecordType =
  | "ORDER_PAYMENT"
  | "ADDITIONAL_PAYMENT";

export type FinancialOrderInvoice = {
  id?: string;
  _id?: string;
  invoiceNo?: string | null;
  invoiceDate?: string | null;
  ownerRole?: string | null;
  kind?: string | null;
  invoiceSource?: string | null;
  isAdditionalPaymentInvoice?: boolean;
};

export type FinancialOrderRow = {
  id: string;
  recordType?: FinancialOrderRecordType;
  orderPrettyId: string;
  status: string;
  paymentStatus: string;
  paidAt: string | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  clientUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    imgUrl: string;
  };
  providerUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    imgUrl: string;
  };
  totalPrice: number | null;
  totalProviderPrice: number | null;
  platformFeePrice: number | null;
  refundedAt: string | null;
  releasedFundsToProviderAt: string | null;
  cancelFeePaidToProviderAt: string | null;
  actualClientPaidCents: number | null;
  clientPaidCents?: number | null;
  actualRefundCents: number | null;
  actualPayoutCents: number | null;
  expectedRefundCents: number | null;
  expectedPayoutCents: number | null;
  displayedRefundCents: number | null;
  displayedPayoutCents: number | null;
  stripeFeeCents?: number | null;
  knownStripeFeeCents: number | null;
  forecastStripeFeeCents?: number | null;
  grossPlatformRevenueCents: number | null;
  netPlatformRevenueCents: number | null;
  financialMode?: FinancialOrderMode | null;
  paymentId?: string | null;
  paymentKind?: string | null;
  note?: string | null;
  payoutStatus?: string | null;
  payoutId?: string | null;
  invoices?: FinancialOrderInvoice[];
};

export type FinancialOrdersSubtotal = {
  totalOrders: number;
  clientPaidCents: number;
  refundCents: number;
  payoutCents: number;
  stripeFeeCents: number;
  grossPlatformRevenueCents: number;
  netPlatformRevenueCents: number;
  forecastCount: number;
  partialRealCount: number;
  realCount: number;
  orderPaymentCount?: number;
  additionalPaymentCount?: number;
};

export type GetFinancialOrdersResponse = {
  items: FinancialOrderRow[];
  total: number;
  subtotal: FinancialOrdersSubtotal;
  pageSize: number;
  startIndex: number;
  hasMore: boolean;
  filters?: {
    search?: string | null;
    status?: string | null;
    financialMode?: FinancialOrderMode | null;
    startDate?: string | null;
    endDate?: string | null;
    startsFrom?: string | null;
    startsTo?: string | null;
    sort?: string | null;
  };
};
