export type RetentionInterval = "week" | "biweek" | "month";

export type ParentActivityRetentionPeriod = {
  period: number;
  activeUsers: number;
  retentionRate: number;
  /** The period is still running; the value can only grow. */
  isPartial: boolean;
};

export type ParentActivityRetentionCohort = {
  cohort: string;
  cohortStart: string;
  cohortEnd: string;
  cohortSize: number;
  periods: ParentActivityRetentionPeriod[];
};

export type ParentActivityRetentionAveragePoint = {
  period: number;
  cohorts: number;
  cohortUsers: number;
  activeUsers: number;
  retentionRate: number;
};

export type ParentActivityRetentionResponse = {
  interval: RetentionInterval;
  timezone: string;
  generatedAt: string;
  launchDay: string | null;
  currentPeriodStart: string | null;
  trackingStartedAt: string | null;
  qualifyingActivityTypes: string[];
  maxPeriods: number;
  cohorts: ParentActivityRetentionCohort[];
  average: ParentActivityRetentionAveragePoint[];
};
