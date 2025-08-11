import { ClientDetails } from "@/types/Client";
import profileImg from "../assets/images/profile.svg";
import phoneImg from "../assets/images/phone.svg";
import locationPinImg from "../assets/images/location-pin.svg";
import idImg from "../assets/images/id.svg";
import shieldImg from "../assets/images/shield.svg";

export const getInfoCards = (client: ClientDetails) => {
  return [
    {
      title: "Full name",
      icon: profileImg,
      value: `${client.user.firstName} ${client.user.lastName}`,
    },
    {
      title: "Phone number",
      icon: phoneImg,
      value: client.user.phoneNumber,
    },
    {
      title: "ID verification",
      icon: idImg,
      value: client.user.isUserVerified ? "Verified" : "Not verified",
    },
    {
      title: "City",
      icon: locationPinImg,
      value: client.defaultAddress.city,
    },
    {
      title: "Criminal record check",
      icon: shieldImg,
      value: "?",
    },
  ];
};
