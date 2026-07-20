import {
  CompensationRequest,
  CompensationRequestStatus,
  UserDetails,
} from "@/types/Client";

export type NormalizedCompensationRequest = CompensationRequest & {
  id: string;
  isFallback: boolean;
};

const LEGACY_REQUEST_ID = "legacy-compensation-request";

const normalizeCommentText = (value: unknown) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .filter((comment): comment is string => typeof comment === "string")
      .join("\n");
  }
  return "";
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const formatCompensationDateTime = (value?: string | null) => {
  const date = parseDate(value);
  if (!date) return "-";
  return date.toLocaleString();
};

export const formatCompensationRequestStatus = (status?: string | null) => {
  if (!status) return "UNKNOWN";
  return status.replace(/_/g, " ");
};

export const getCompensationRequestStatusTone = (status?: string | null) => {
  switch (status) {
    case "REQUESTED":
      return "requested";
    case "CONTACTED":
      return "contacted";
    case "IN_PROGRESS":
      return "inProgress";
    case "COMPLETED":
      return "completed";
    default:
      return "unknown";
  }
};

export const COMPENSATION_REQUEST_STATUS_ORDER = [
  "REQUESTED",
  "CONTACTED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export const normalizeCompensationRequests = (
  client?: UserDetails["client"],
): NormalizedCompensationRequest[] => {
  const newRequests = client?.compensationRequests ?? [];

  if (newRequests.length > 0) {
    return [...newRequests]
      .map((request, index) => ({
        ...request,
        comments: normalizeCommentText(
          (request as { comments?: unknown }).comments,
        ),
        id:
          request.requestId?.trim() ||
          request.id?.trim() ||
          request._id?.trim() ||
          `${request.requestedCompensationInfoAt}-${request.changedAt}-${index}`,
        isFallback: false,
      }))
      .sort((a, b) => {
        const aTime = parseDate(a.changedAt)?.getTime() ?? 0;
        const bTime = parseDate(b.changedAt)?.getTime() ?? 0;
        return bTime - aTime;
      });
  }

  const requestedAt = client?.requestedCompensationInfoAt ?? null;
  const contactedAt = client?.contactedRegardingCompensationAt ?? null;
  const fallbackRequestedAt = parseDate(requestedAt);
  const fallbackContactedAt = parseDate(contactedAt);

  if (!fallbackRequestedAt && !fallbackContactedAt) {
    return [];
  }

  const changedAt = fallbackContactedAt ?? fallbackRequestedAt ?? new Date(0);
  const status: CompensationRequestStatus = contactedAt
    ? "CONTACTED"
    : "REQUESTED";

  return [
    {
      id: LEGACY_REQUEST_ID,
      requestedCompensationInfoAt:
        fallbackRequestedAt?.toISOString() ??
        fallbackContactedAt?.toISOString() ??
        changedAt.toISOString(),
      status,
      comments: "",
      changedAt: changedAt.toISOString(),
      isFallback: true,
    },
  ];
};

export const getCompensationRequestAlertState = (
  client?: UserDetails["client"],
) => {
  const requests = normalizeCompensationRequests(client);
  return requests.some((request) => request.status !== "COMPLETED");
};

export const getCompensationRequestSummaryLines = (
  client?: UserDetails["client"],
) => {
  const requests = normalizeCompensationRequests(client);

  if (requests.length === 0) {
    return {
      hasAlert: false,
      lines: [{ text: "No requests" }],
    };
  }

  const hasAlert = requests.some((request) => request.status !== "COMPLETED");
  const lines = requests.slice(0, 2).map((request) => ({
    text: `${formatCompensationRequestStatus(request.status)} • ${formatCompensationDateTime(
      request.changedAt,
    )}`,
  }));

  if (requests.length > 2) {
    lines.push({ text: `+ ${requests.length - 2} more` });
  }

  return { hasAlert, lines };
};
