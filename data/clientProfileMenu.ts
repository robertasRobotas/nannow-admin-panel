import { ClientDetails } from "@/types/Client";
import { CirclesSquareIcon } from "@/components/Icons/CirclesSquareIcon";
import MessagesIcon from "@/components/Icons/MessagesIcon";
import HouseIcon from "@/components/Icons/HouseIcon";
import DocInProgressIcon from "@/components/Icons/DocInProgressIcon";
import DocWithPencilIcon from "@/components/Icons/DocWithPencilIcon";
import BadgeIcon from "@/components/Icons/BadgeIcon";
import IdIcon from "@/components/Icons/IdIcon";
import DocWithCheckmarkIcon from "@/components/Icons/DocWithCheckmarkIcon";
import DocWithErrorIcon from "@/components/Icons/DocWithErrorIcon";
import ChildrenIcon from "@/components/Icons/ChildrenIcon";

export const getButtonsData = (client: ClientDetails) => {
  return [
    { title: "General info", icon: CirclesSquareIcon, id: "general" },
    {
      title: "Messages",
      icon: MessagesIcon,
      number: client?.chatCount ?? 0,
      id: "messages",
    },
    {
      title: "Children",
      icon: ChildrenIcon,
      number: client?.children?.length ?? 0,
      id: "children",
    },
    {
      title: "Addresses",
      icon: HouseIcon,
      number: client?.addresses?.length ?? 0,
      id: "addresses",
    },
    {
      title: "Reviews",
      icon: DocWithPencilIcon,
      number:
        (client?.reviews?.given?.length ?? 0) +
        (client?.reviews?.received?.stats?.count ?? 0),
      id: "reviews",
    },
    {
      title: "Badges",
      icon: BadgeIcon,
      number: client?.client?.badgesIds?.length ?? 0,
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
      number: client?.orders?.countsByStatus?.[0]?.count ?? 0,
      id: "completed_orders",
    },
    {
      title: "Active orders",
      icon: DocInProgressIcon,
      number: client?.orders?.countsByStatus?.[1]?.count ?? 0,
      id: "active_orders",
    },
    {
      title: "Canceled orders",
      icon: DocWithErrorIcon,
      number: client?.orders?.countsByStatus?.[2]?.count ?? 0,
      id: "canceled_orders",
    },
  ];
};
