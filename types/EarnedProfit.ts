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

export type EarnedProfitNormalServiceNegativeContributor = {
  kind: "NORMAL_SERVICE";
  orderId: string;
  orderPrettyId: string | null;
  status: string;
  serviceCompletedAt: string | null;
  paymentCount: number;
  clientPaidCents: number;
  providerEarnedCents: number;
  grossProfitBeforeStripeFeesCents: number;
  knownStripeFeeCents: number;
  stripeFeeUnknownPaymentCount: number;
  netProfitCents: number | null;
};

export type EarnedProfitAdditionalPaymentNegativeContributor = {
  kind: "ADDITIONAL_PROVIDER_PAYMENT";
  paymentId: string;
  orderId: string | null;
  paymentCompletedAt: string | null;
  note: string | null;
  clientPaidCents: number;
  providerEarnedCents: number;
  grossProfitBeforeStripeFeesCents: number;
  knownStripeFeeCents: number;
  stripeFeeUnknownPaymentCount: number;
  netProfitCents: number | null;
};

export type EarnedProfitDebug = {
  enabled: boolean;
  breakdownLimit: number;
  negativeContributors: {
    normalServices: EarnedProfitNormalServiceNegativeContributor[];
    additionalProviderPayments: EarnedProfitAdditionalPaymentNegativeContributor[];
  };
};

export type EarnedProfitResponse = {
  currency: string;
  period: EarnedProfitPeriod;
  assumptions: EarnedProfitAssumptions;
  debug?: EarnedProfitDebug;
  totals: EarnedProfitTotals;
  normalServices: EarnedProfitSummary;
  additionalProviderPayments: EarnedProfitSummary;
};
