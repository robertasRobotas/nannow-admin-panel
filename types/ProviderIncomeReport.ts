export type ProviderIncomeRow = {
  providerId: string;
  provider: string;
  orderCount: number;
  orderAmountCents: number;
  providerIncomeCents: number;
  stripeFeeCents: number;
  activeStripeAccountCount: number;
  connectActiveAccountFeeCents: number;
  totalStripeCostCents: number;
  grossPlatformFeeCents: number;
  netPlatformFeeCents: number;
  netPlatformFeeAfterConnectCents: number;
};

export type ProviderIncomeTotals = Omit<ProviderIncomeRow, "providerId" | "provider"> & {
  providerCount: number;
  refundStripeFeeCents: number;
  netPlatformFeeAfterRefundsAndConnectCents: number;
};

export type ProviderIncomeReportResponse = {
  currency: string;
  period: {
    startDate: string;
    endDate: string;
    endExclusive: boolean;
  };
  generatedAt: string;
  requiresRegeneration: boolean;
  totals: ProviderIncomeTotals;
  providers: ProviderIncomeRow[];
};
