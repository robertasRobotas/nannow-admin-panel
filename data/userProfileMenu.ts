import { UserDetails } from "@/types/Client";
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

export const getButtonsData = (
  user: UserDetails,
  mode: "client" | "provider"
) => {
  const buttons = [
    {
      title: "General info",
      icon: CirclesSquareIcon,
      id: "general",
      visibleFor: ["client", "provider"],
    },
    {
      title: "Messages",
      icon: MessagesIcon,
      number: user?.chatCount ?? 0,
      id: "messages",
      visibleFor: ["client", "provider"],
    },
    {
      title: "Children",
      icon: ChildrenIcon,
      number: user?.children?.length ?? 0,
      id: "children",
      visibleFor: ["client"],
    },
    {
      title: "Addresses",
      icon: HouseIcon,
      number: user?.addresses?.length ?? 0,
      id: "addresses",
      visibleFor: ["client", "provider"],
    },
    {
      title: "Given Reviews",
      icon: DocWithPencilIcon,
      number: user?.givenReviews?.length ?? 0,
      id: "given_reviews",
      visibleFor: ["client", "provider"],
    },
    {
      title: "Received Reviews",
      icon: DocWithPencilIcon,
      number: user?.receivedReviews?.length ?? 0,
      id: "received_reviews",
      visibleFor: ["client", "provider"],
    },
    {
      title: "Badges",
      icon: BadgeIcon,
      number: user?.client?.badgesIds?.length ?? 0,
      id: "badges",
      visibleFor: ["client", "provider"],
    },
    {
      title: "Profile completion",
      icon: IdIcon,
      number: 0,
      id: "profile_completion",
      visibleFor: ["client", "provider"],
    },
    {
      title: "Completed orders",
      icon: DocWithCheckmarkIcon,
      number: user?.orders?.countsByStatus?.[0]?.count ?? 0,
      id: "completed_orders",
      visibleFor: ["provider"],
    },
    {
      title: "Active orders",
      icon: DocInProgressIcon,
      number: user?.orders?.countsByStatus?.[1]?.count ?? 0,
      id: "active_orders",
      visibleFor: ["provider"],
    },
    {
      title: "Canceled orders",
      icon: DocWithErrorIcon,
      number: user?.orders?.countsByStatus?.[2]?.count ?? 0,
      id: "canceled_orders",
      visibleFor: ["provider"],
    },
  ];

  return buttons.filter(
    (btn) => !btn.visibleFor || btn.visibleFor.includes(mode)
  );
};
