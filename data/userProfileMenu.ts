import { UserDetails } from "@/types/Client";
import { CirclesSquareIcon } from "@/components/Icons/CirclesSquareIcon";
import MessagesIcon from "@/components/Icons/MessagesIcon";
import HouseIcon from "@/components/Icons/HouseIcon";
import DocInProgressIcon from "@/components/Icons/DocInProgressIcon";
import DocWithPencilIcon from "@/components/Icons/DocWithPencilIcon";
import BadgeIcon from "@/components/Icons/BadgeIcon";
import DocWithCheckmarkIcon from "@/components/Icons/DocWithCheckmarkIcon";
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
      title: "Booked time slots",
      icon: MessagesIcon,
      number: user?.provider?.unavailablePeriods?.length ?? 0,
      id: "booked_time_slots",
      visibleFor: ["client", "provider"],
    },
    {
      title: "Provider Orders",
      icon: DocWithCheckmarkIcon,
      number: user?.orders?.length ?? 0,
      id: "orders",
      visibleFor: ["provider"],
    },

    {
      title: "Client Orders",
      icon: DocWithCheckmarkIcon,
      number: user?.orders?.length ?? 0,
      id: "client_orders",
      visibleFor: ["client"],
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
      title: "Special skills",
      icon: DocWithCheckmarkIcon,
      id: "special_skills",
      visibleFor: ["provider"],
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
      title: "Add Review (Admin)",
      icon: DocWithPencilIcon,
      id: "add_admin_review",
      visibleFor: ["provider"],
    },
    {
      title: "Documents",
      icon: DocInProgressIcon,
      number: user?.documents?.length ?? 0,
      id: "documents",
      visibleFor: ["provider"],
    },
    {
      title: "Badges",
      icon: BadgeIcon,
      number: user?.provider?.badgesIds?.length ?? 0,
      id: "badges",
      visibleFor: ["provider", "client"],
    },
    // {
    //   title: "Profile completion",
    //   icon: IdIcon,
    //   number: 0,
    //   id: "profile_completion",
    //   visibleFor: ["client", "provider"],
    // },
    // {
    //   title: "Completed orders",
    //   icon: DocWithCheckmarkIcon,
    //   number: user?.orders?.countsByStatus?.[0]?.count ?? 0,
    //   id: "completed_orders",
    //   visibleFor: ["provider"],
    // },
    // {
    //   title: "Active orders",
    //   icon: DocInProgressIcon,
    //   number: user?.orders?.countsByStatus?.[1]?.count ?? 0,
    //   id: "active_orders",
    //   visibleFor: ["provider"],
    // },
    // {
    //   title: "Canceled orders",
    //   icon: DocWithErrorIcon,
    //   number: user?.orders?.countsByStatus?.[2]?.count ?? 0,
    //   id: "canceled_orders",
    //   visibleFor: ["provider"],
    // },
  ];

  return buttons.filter(
    (btn) => !btn.visibleFor || btn.visibleFor.includes(mode)
  );
};
