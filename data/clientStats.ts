import { Client } from "@/types/Client";
import DocWithCheckmarkIcon from "@/components/Icons/DocWithCheckmarkIcon";
import DocInProgressIcon from "@/components/Icons/DocInProgressIcon";
import DocWithErrorIcon from "@/components/Icons/DocWithErrorIcon";
import MessagesIcon from "@/components/Icons/MessagesIcon";
import ChildrenIcon from "@/components/Icons/ChildrenIcon";
import DocWithPencilIcon from "@/components/Icons/DocWithPencilIcon";

export const getClientStats = (client: Client) => [
  {
    key: "completed_orders",
    icon: DocWithCheckmarkIcon,
    value: client.completed_orders,
  },
  {
    key: "active_orders",
    icon: DocInProgressIcon,
    value: client.active_orders,
  },
  {
    key: "cancelled_orders",
    icon: DocWithErrorIcon,
    value: client.cancelled_orders,
  },
  {
    key: "messages",
    icon: MessagesIcon,
    value: client.messages,
  },
  {
    key: "children",
    icon: ChildrenIcon,
    value: client.children,
  },
  {
    key: "reviews",
    icon: DocWithPencilIcon,
    value: client.reviews,
  },
];
