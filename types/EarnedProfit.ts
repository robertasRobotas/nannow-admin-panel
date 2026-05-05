export type EarnedProfitPeriod = {
  startDate: string;
  endDate: string;
  endExclusive: boolean;
};

export type EarnedProfitAssumptions = {
  normalOrders: string;
  additionalProviderPayments: string;
  payoutTiming: string;
  stripeFees: string;
  refunds: string;
};

export type EarnedProfitSummary = {
  count: number;
  paymentCount: number;
  clientPaidCents: number;
  providerEarnedCents: number;
  grossProfitBeforeStripeFeesCents: number;
  knownStripeFeeCents: number;
  netProfitCents: number | null;
  stripeFeeUnknownPaymentCount: number;
  recordsWithUnknownStripeFee: number;
};

export type EarnedProfitTotals = Omit<
  EarnedProfitSummary,
  "count" | "paymentCount" | "recordsWithUnknownStripeFee"
>;

export type EarnedProfitResponse = {
  currency: string;
  period: EarnedProfitPeriod;
  assumptions: EarnedProfitAssumptions;
  totals: EarnedProfitTotals;
  normalServices: EarnedProfitSummary;
  additionalProviderPayments: EarnedProfitSummary;
};
