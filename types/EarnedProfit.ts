export type EarnedProfitPeriod = {
  startDate: string;
  endDate: string;
  endExclusive: boolean;
};

export type EarnedProfitTotals = {
  rowCount: number;
  invoiceCount: number;
  refundCount: number;
  profitCents: number;
  stripeFeeCents: number;
  netProfitCents: number;
};

export type EarnedProfitBreakdownRow = {
  entryKind: "INVOICE" | "REFUND" | string;
  invoiceOrOrderNumber: string;
  orderId: string;
  date: string;
  dateTime: string;
  client: string;
  provider: string;
  totalAmount: string | null;
  profit: string;
  stripeFee: string;
  netProfit: string;
};

export type EarnedProfitResponse = {
  currency: string;
  period: EarnedProfitPeriod;
  totals: EarnedProfitTotals;
  breakdown: EarnedProfitBreakdownRow[];
};
