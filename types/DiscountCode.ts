export type DiscountUsageType = "ONE_TIME" | "ONCE_PER_USER";
export type DiscountStatus = "ACTIVE" | "REDEEMED" | "REVOKED";

export type DiscountCode = {
  id: string;
  code: string;
  percentOff: number;
  usageType: DiscountUsageType;
  status: DiscountStatus;
  expiresAt?: string | null;
  redeemedAt?: string | null;
  redeemedByUserId?: string | null;
  createdByAdminId?: string | null;
  createdAt: string;
  updatedAt?: string;
  usedCount?: number;
};
