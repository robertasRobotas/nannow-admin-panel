export const options = [
  { title: "All", value: "" },
  { title: "ORDER_CREATED (WITHOUT DIRECT BOOKING)", value: "ORDER_CREATED" },
  {
    title: "CLIENT_ORDER_CREATION_IN_PROCESS",
    value: "CLIENT_ORDER_CREATION_IN_PROCESS",
  },
  { title: "PROVIDER_OFFERED_SERVICE", value: "PROVIDER_OFFERED_SERVICE" },
  {
    title: "PROVIDER_ACCEPTED_DIRECT_OFFER",
    value: "PROVIDER_ACCEPTED_DIRECT_OFFER",
  },
  {
    title: "PROVIDER_REJECTED_DIRECT_OFFER",
    value: "PROVIDER_REJECTED_DIRECT_OFFER",
  },
  { title: "BOTH_APPROVED", value: "BOTH_APPROVED" },
  {
    title: "PROVIDER_MARKED_AS_SERVICE_IN_PROGRESS",
    value: "PROVIDER_MARKED_AS_SERVICE_IN_PROGRESS",
  },
  {
    title: "PROVIDER_MARKED_AS_SERVICE_ENDED",
    value: "PROVIDER_MARKED_AS_SERVICE_ENDED",
  },
  { title: "CANCELED_BY_CLIENT", value: "CANCELED_BY_CLIENT" },
  { title: "CANCELED_BY_PROVIDER", value: "CANCELED_BY_PROVIDER" },
  {
    title: "CANCELED_NOT_PAID_BY_CLIENT",
    value: "CANCELED_NOT_PAID_BY_CLIENT",
  },
  { title: "Not started in time", value: "NOT_STARTED_IN_TIME" },
  { title: "Not Ended in time", value: "NOT_ENDED_IN_TIME" },
];

export const normalizeOrderStatus = (status?: string | null) => {
  const normalizedStatus = String(status ?? "").toUpperCase();

  if (normalizedStatus === "CLIENT_CANCELED") {
    return "CANCELED_BY_CLIENT";
  }

  if (normalizedStatus === "PROVIDER_CANCELED") {
    return "CANCELED_BY_PROVIDER";
  }

  return normalizedStatus;
};

export const getOrderStatusTitle = (
  status?: string | null,
  isDirectOrderToProvider = false,
) => {
  const normalizedStatus = normalizeOrderStatus(status);

  if (normalizedStatus === "ORDER_CREATED" && isDirectOrderToProvider) {
    return "ORDER_CREATED (DIRECT ORDER TO PROVIDER)";
  }

  return (
    options.find((option) => option.value === normalizedStatus)?.title ??
    normalizedStatus
  );
};
