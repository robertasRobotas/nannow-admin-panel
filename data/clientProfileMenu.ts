import { Client } from "@/types/Client";
import circlesSquareImg from "../assets/images/circles-square.svg";
import messagesImg from "../assets/images/messages.svg";
import babyImg from "../assets/images/baby.svg";
import houseImg from "../assets/images/house.svg";
import reviewsImg from "../assets/images/doc-with-pencil.svg";
import badgesImg from "../assets/images/badge.svg";
import profilePlusImg from "../assets/images/id.svg";
import docInProgressImg from "../assets/images/doc-in-progress.svg";
import docWithCheckmarkImg from "../assets/images/doc-with-checkmark.svg";
import docWithErrorImg from "../assets/images/doc-with-error.svg";

export const getButtonsData = (client: Client) => {
  return [
    { title: "General info", img: circlesSquareImg },
    { title: "Messages", img: messagesImg, number: client.messages },
    { title: "Children", img: babyImg, number: client.children },
    { title: "Addresses", img: houseImg, number: client.addresses },
    { title: "Reviews", img: reviewsImg, number: client.reviews },
    { title: "Badges", img: badgesImg, number: client.badges },
    {
      title: "Profile completion",
      img: profilePlusImg,
      number: client.profile_completion,
    },
    {
      title: "Completed orders",
      img: docWithCheckmarkImg,
      number: client.completed_orders,
    },
    {
      title: "Active orders",
      img: docInProgressImg,
      number: client.active_orders,
    },
    {
      title: "Canceled orders",
      img: docWithErrorImg,
      number: client.cancelled_orders,
    },
  ];
};
