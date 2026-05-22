export type TrackingPin = {
  id: string;
  kind: "CLIENT" | "PROVIDER" | "ORDER" | "LAST_KNOWN_PROVIDER";
  label: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
  avatarUrl?: string;
  profileUrl?: string;
  orderStatus?: string;
  orderStartsAt?: string;
  orderEndsAt?: string;
  orderTotalPrice?: number | null;
  orderCount?: number;
};

export type TrackingPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
};
