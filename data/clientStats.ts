import { Client } from "@/types/Client";
import babyImg from "../assets/images/baby.svg";
import docInProgressImg from "../assets/images/doc-in-progress.svg";
import docWithCheckmarkImg from "../assets/images/doc-with-checkmark.svg";
import docWithErrorImg from "../assets/images/doc-with-error.svg";
import docWithPencilImg from "../assets/images/doc-with-pencil.svg";
import messagesImg from "../assets/images/messages.svg";

export const getClientStats = (client: Client) => [
  {
    key: "completed_orders",
    alt: "Completed",
    icon: docWithCheckmarkImg.src,
    value: client.completed_orders,
  },
  {
    key: "active_orders",
    alt: "In progress",
    icon: docInProgressImg.src,
    value: client.active_orders,
  },
  {
    key: "cancelled_orders",
    alt: "Cancelled",
    icon: docWithErrorImg.src,
    value: client.cancelled_orders,
  },
  {
    key: "messages",
    alt: "Messages",
    icon: messagesImg.src,
    value: client.messages,
  },
  {
    key: "children",
    alt: "Children",
    icon: babyImg.src,
    value: client.children,
  },
  {
    key: "reviews",
    alt: "Reviews",
    icon: docWithPencilImg.src,
    value: client.reviews,
  },
];
