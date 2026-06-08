export type PlatformFeeInvoiceReport = {
  id: string;
  periodKey: string;
  periodYear: number;
  periodMonth: number;
  timezone: string;
  periodStart: string;
  periodEnd: string;
  fileName: string;
  rowCount: number;
  generatedAt: string;
  downloadPath: string;
};

export type GetPlatformFeeInvoiceReportsResponse = {
  reports: PlatformFeeInvoiceReport[];
};

export type RegeneratePlatformFeeInvoiceReportResponse = {
  report: PlatformFeeInvoiceReport;
};
