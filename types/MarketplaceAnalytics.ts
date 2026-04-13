export type MarketplaceAnalyticsInterval = "day" | "week" | "month";

export type MarketplaceAnalyticsKpis = {
  totalOrders: number;
  paidOrders: number;
  completedOrders: number;
  canceledOrders: number;
  revenueCents: number;
  uniquePayingParents: number;
  uniqueActiveSitters: number;
  repeatParentRate: number;
  repeatSitterRate: number;
};

export type MarketplaceAnalyticsTimeseriesItem = {
  bucket: string;
  totalOrders: number;
  paidOrders: number;
  revenueCents: number;
};

export type MarketplaceAnalyticsFunnel = {
  createdOrders: number;
  paidOrders: number;
  completedOrders: number;
  canceledOrders: number;
  paidRateFromCreated: number;
  completedRateFromCreated: number;
  completedRateFromPaid: number;
};

export type MarketplaceAnalyticsBreakdownItem = {
  status?: string | null;
  reason?: string | null;
  count: number;
};

export type MarketplaceAnalyticsCancellationBreakdown = {
  totalCanceledOrders: number;
  byStatus: MarketplaceAnalyticsBreakdownItem[];
  byReason: MarketplaceAnalyticsBreakdownItem[];
};

export type MarketplaceAnalyticsParentTopItem = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imgUrl: string | null;
  paidOrdersCount: number;
  revenueCents: number;
};

export type MarketplaceAnalyticsSitterTopItem = {
  providerId: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imgUrl: string | null;
  paidBookingsCount: number;
  revenueCents: number;
};

export type MarketplaceAnalyticsRepeatParents = {
  uniqueUsers: number;
  repeatUsers: number;
  repeatRate: number;
  averagePaidOrdersPerUser: number;
  totalPaidOrders: number;
  totalRevenueCents: number;
  topParents: MarketplaceAnalyticsParentTopItem[];
};

export type MarketplaceAnalyticsRepeatSitters = {
  uniqueUsers: number;
  repeatUsers: number;
  repeatRate: number;
  averagePaidOrdersPerUser: number;
  totalPaidOrders: number;
  totalRevenueCents: number;
  topSitters: MarketplaceAnalyticsSitterTopItem[];
};

export type MarketplaceAnalyticsCohortPeriod = {
  period: number;
  activeUsers: number;
  retentionRate: number;
};

export type MarketplaceAnalyticsCohortRow = {
  cohort: string;
  cohortSize: number;
  periods: MarketplaceAnalyticsCohortPeriod[];
};

export type MarketplaceAnalyticsResponseData = {
  overview: {
    kpis: MarketplaceAnalyticsKpis;
    timeseries: MarketplaceAnalyticsTimeseriesItem[];
    funnel: MarketplaceAnalyticsFunnel;
    cancellationBreakdown: MarketplaceAnalyticsCancellationBreakdown;
  };
  repeat: {
    parents: MarketplaceAnalyticsRepeatParents;
    sitters: MarketplaceAnalyticsRepeatSitters;
  };
  cohorts: {
    parents: MarketplaceAnalyticsCohortRow[];
    sitters: MarketplaceAnalyticsCohortRow[];
  };
};

export type MarketplaceAnalyticsAppliedFilters = {
  dateFrom?: string | null;
  dateTo?: string | null;
  interval: MarketplaceAnalyticsInterval;
  timezone?: string | null;
  country?: string | null;
  city?: string | null;
  statuses?: string[];
  paymentStatuses?: string[];
  topLimit?: number | null;
};

export type GetMarketplaceAnalyticsResponse = {
  result: MarketplaceAnalyticsResponseData;
  filters: MarketplaceAnalyticsAppliedFilters;
};

export type MarketplaceAnalyticsRebuildResponse = {
  result: {
    dateFrom: string;
    dateTo: string;
    ordersScanned: number;
    dailySnapshotsRebuilt: number;
    userDailyFactsRebuilt: number;
    snapshotTimezone: string;
  };
};
