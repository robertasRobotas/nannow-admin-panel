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

export type DailyNetIncomeRebuildJobProgress = {
  monthsTotal: number;
  monthsProcessed: number;
  currentMonthKey: string;
};

export type DailyNetIncomeRebuildJob = {
  id: string;
  requestedByAdminId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  error: string | null;
  progress: DailyNetIncomeRebuildJobProgress;
  result: {
    daysRebuilt: number;
  };
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};
