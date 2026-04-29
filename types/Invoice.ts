export type InvoiceOwnerRole = "CLIENT" | "PROVIDER";

export type InvoiceKind =
  | "PLATFORM_FEE_INVOICE"
  | "PROVIDER_INVOICE"
  | "PROVIDER_RECEIPT";

export type InvoiceSource =
  | "ORDER_PAYOUT"
  | "ADDITIONAL_PAYMENT_PAYOUT"
  | string;

export type InvoiceOwner = {
  id: string;
  firstName?: string;
  lastName?: string;
  imgUrl?: string;
};

export type Invoice = {
  id: string;
  orderId: string;
  ownerUserId: string;
  ownerRole: InvoiceOwnerRole;
  kind: InvoiceKind;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  currency: string;
  issuedAt: string;
  issuedByAdminId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  owner?: InvoiceOwner;
  payoutId?: string | null;
  paymentIds?: string[];
  serviceDescription?: string | null;
  isAdditionalPaymentInvoice?: boolean;
  invoiceSource?: InvoiceSource | null;
};

export type GetInvoicesResponse = {
  items: Invoice[];
  total: number;
  startIndex: number;
  pageSize: number;
};
