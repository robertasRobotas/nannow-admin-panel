type ReportType = {
  id: string;
  reportedRole: string;
  reportedUserId: string;
  reportMessage: string;
  reportedByUserId: string;
  createdAt: string;
  updatedAt: string;
  isResolved: boolean;
  resolvedAt: string | null;
  adminNotes: string[];

  reportedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    imgUrl: string;
  };

  reportedUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    imgUrl: string;
  };
};
