export type CriminalCheckUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isProvider: boolean;
  providerId: string;
  createdAt: string;
  criminalRecordStatus: "APPROVED" | "REJECTED" | "PENDING" | "NOT_SUBMITTED";
};
