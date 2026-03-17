export type AdminEvent =
  | { type: "ORDER_CREATED"; orderId: string }
  | { type: "ORDER_CONFIRMED"; orderId: string }
  | { type: "ORDER_CANCELED"; orderId: string }
  | {
      type: "CRIMINAL_CHECK_SUBMITTED";
      userId: string;
      applicationId?: string;
    }
  | {
      type: "CRIMINAL_CHECK_APPROVED";
      userId: string;
      applicationId: string;
      userName: string;
    }
  | { type: "FEEDBACK_CREATED"; feedbackId: string }
  | { type: "FEEDBACK_RESOLVED"; feedbackId: string; userId: string }
  | { type: "USER_REPORTED"; reportId: string }
  | { type: "REPORT_RESOLVED"; reportId: string; userId: string };

export type AdminSocketEvent = AdminEvent & {
  title: string;
  description?: string;
  linkHref?: string;
  linkLabel?: string;
};

export type AdminSocketListener = (event: AdminSocketEvent) => void;
