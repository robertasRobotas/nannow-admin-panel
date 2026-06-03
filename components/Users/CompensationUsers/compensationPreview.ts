import { User, UserDetails } from "@/types/Client";
import {
  formatCompensationDateTime,
  formatCompensationRequestStatus,
  normalizeCompensationRequests,
} from "@/data/compensationRequests";

export type UserWithCompensationDetails = User & {
  client?: UserDetails["client"];
};

const getFirstCommentLine = (value?: string | null) => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "No comment";

  const firstLine = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine || "No comment";
};

export const getCompensationPreview = (user: UserWithCompensationDetails) => {
  const request = normalizeCompensationRequests(user.client)[0];

  if (!request) return null;

  return {
    status: formatCompensationRequestStatus(request.status),
    changedAt: formatCompensationDateTime(request.changedAt),
    comment: getFirstCommentLine(request.comments),
  };
};
