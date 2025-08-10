import { Client } from "@/types/Client";
import { CirclesSquareIcon } from "@/components/Icons/CirclesSquareIcon";
import MessagesIcon from "@/components/Icons/MessagesIcon";
import HouseIcon from "@/components/Icons/HouseIcon";
import DocInProgressIcon from "@/components/Icons/DocInProgressIcon";
import DocWithPencilIcon from "@/components/Icons/DocWithPencilIcon";
import BadgeIcon from "@/components/Icons/BadgeIcon";
import IdIcon from "@/components/Icons/IdIcon";
import DocWithCheckmarkIcon from "@/components/Icons/DocWithCheckmarkIcon";
import DocWithErrorIcon from "@/components/Icons/DocWithErrorIcon";

export const getButtonsData = (client: Client) => {
  return [
    { title: "General info", icon: CirclesSquareIcon, id: "general" },
    {
      title: "Messages",
      icon: MessagesIcon,
      number: client.messages,
      id: "messages",
    },
    {
      title: "Children",
      icon: CirclesSquareIcon,
      number: client.children,
      id: "children",
    },
    {
      title: "Addresses",
      icon: HouseIcon,
      number: client.addresses,
      id: "addresses",
    },
    {
      title: "Reviews",
      icon: DocWithPencilIcon,
      number: client.reviews,
      id: "reviews",
    },
    {
      title: "Badges",
      icon: BadgeIcon,
      number: client.badges,
      id: "badges",
    },
    {
      title: "Profile completion",
      icon: IdIcon,
      number: client.profile_completion,
      id: "profile_comletion",
    },
    {
      title: "Completed orders",
      icon: DocWithCheckmarkIcon,
      number: client.completed_orders,
      id: "completed_orders",
    },
    {
      title: "Active orders",
      icon: DocInProgressIcon,
      number: client.active_orders,
      id: "active_orders",
    },
    {
      title: "Canceled orders",
      icon: DocWithErrorIcon,
      number: client.cancelled_orders,
      id: "canceled_orders",
    },
  ];
};
