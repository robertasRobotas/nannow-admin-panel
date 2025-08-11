import { Client, ClientDetails } from "@/types/Client";
import { CirclesSquareIcon } from "@/components/Icons/CirclesSquareIcon";
import MessagesIcon from "@/components/Icons/MessagesIcon";
import HouseIcon from "@/components/Icons/HouseIcon";
import DocInProgressIcon from "@/components/Icons/DocInProgressIcon";
import DocWithPencilIcon from "@/components/Icons/DocWithPencilIcon";
import BadgeIcon from "@/components/Icons/BadgeIcon";
import IdIcon from "@/components/Icons/IdIcon";
import DocWithCheckmarkIcon from "@/components/Icons/DocWithCheckmarkIcon";
import DocWithErrorIcon from "@/components/Icons/DocWithErrorIcon";

export const getButtonsData = (client: ClientDetails) => {
  return [
    { title: "General info", icon: CirclesSquareIcon, id: "general" },
    {
      title: "Messages",
      icon: MessagesIcon,
      number: client.chatCount,
      id: "messages",
    },
    {
      title: "Children",
      icon: CirclesSquareIcon,
      number: client.children.length,
      id: "children",
    },
    {
      title: "Addresses",
      icon: HouseIcon,
      number: client.addresses.length,
      id: "addresses",
    },
    {
      title: "Reviews",
      icon: DocWithPencilIcon,
      number: client.reviews.given.length + client.reviews.received.stats.count,
      id: "reviews",
    },
    {
      title: "Badges",
      icon: BadgeIcon,
      number: client.client.badgesIds.length,
      id: "badges",
    },
    {
      title: "Profile completion",
      icon: IdIcon,
      number: 0,
      id: "profile_comletion",
    },
    {
      title: "Completed orders",
      icon: DocWithCheckmarkIcon,
      number: client.orders.countsByStatus[0].count,
      id: "completed_orders",
    },
    {
      title: "Active orders",
      icon: DocInProgressIcon,
      number: client.orders.countsByStatus[1].count,
      id: "active_orders",
    },
    {
      title: "Canceled orders",
      icon: DocWithErrorIcon,
      number: client.orders.countsByStatus[2].count,
      id: "canceled_orders",
    },
  ];
};
