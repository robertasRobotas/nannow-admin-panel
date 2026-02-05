import { title } from "process";

export const options = [
  { title: "All", value: "" },
  { title: "ORDER_CREATED (DIRECT ORDER TO PROVIDER)", value: "ORDER_CREATED" },
  { title: "PROVIDER_OFFERED_SERVICE", value: "PROVIDER_OFFERED_SERVICE" },
  {
    title: "PROVIDER_ACCEPTED_DIRECT_OFFER",
    value: "PROVIDER_ACCEPTED_DIRECT_OFFER",
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
  { title: "CLIENT_CANCELED", value: "CLIENT_CANCELED" },
  { title: "Not started in time", value: "NOT_STARTED_IN_TIME" },
  { title: "Not Ended in time", value: "NOT_ENDED_IN_TIME" },
];
