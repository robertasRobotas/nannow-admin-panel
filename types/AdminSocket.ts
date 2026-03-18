export type AdminEvent =
  | {
      type: "ADMIN_CONNECTED";
      adminId: string;
      fullName: string;
      email: string;
    }
  | {
      type: "ADMIN_DISCONNECTED";
      adminId: string;
      fullName: string;
      email: string;
    }
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
  | {
      type: "ADMIN_MESSAGE";
      id: string;
      text: string;
      senderAdminId: string;
      senderName: string;
      createdAt: string;
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
