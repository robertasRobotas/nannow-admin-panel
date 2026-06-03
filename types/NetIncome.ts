export type NetIncomePeriod =
  | "today"
  | "this_week"
  | "this_month"
  | "this_year"
  | "custom";

export type NetIncomeSummary = {
  paymentTotalCents: number;
  refundTotalCents: number;
  netIncomeCents: number;
};

export type NetIncomeDailyItem = {
  day: string;
  paymentTotalCents: number;
  refundTotalCents: number;
  netIncomeCents: number;
};

export type NetIncomeDailyResponse = {
  period: NetIncomePeriod;
  timezone: string;
  dateFrom: string;
  dateTo: string;
  summary: NetIncomeSummary;
  items: NetIncomeDailyItem[];
};
