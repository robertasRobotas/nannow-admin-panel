import { UserDetails } from "@/types/Client";
import profileImg from "../assets/images/profile.svg";
import phoneImg from "../assets/images/phone.svg";
import locationPinImg from "../assets/images/location-pin.svg";
import idImg from "../assets/images/id.svg";
import shieldImg from "../assets/images/shield.svg";
import kidImg from "../assets/images/kid-gray.svg";
import walletImg from "../assets/images/wallet.svg";

export const getInfoCards = (
  data: UserDetails,
  mode: "client" | "provider"
) => {
  const baseCards = [
    {
      title: "Full name",
      icon: profileImg,
      value:
        `${data?.user?.firstName ?? ""} ${data?.user?.lastName ?? ""}` || "—",
    },
    {
      title: "Phone number",
      icon: phoneImg,
      value: data?.user?.phoneNumber ?? "—",
    },
    {
      title: "ID verification",
      icon: idImg,
      value: data?.user?.isUserVerified ? "Verified" : "Not verified",
    },
    {
      title: "Push token",
      icon: shieldImg,
      value: data?.user?.pushToken ?? "—",
    },
  ];

  if (mode === "provider") {
    return [
      ...baseCards,
      {
        title: "Criminal record check",
        icon: shieldImg,
        value: data?.provider?.criminalRecord?.status ?? "—",
      },
      {
        title: "Total earnings",
        icon: walletImg,
        value:
          typeof data?.provider?.totalEarnings === "number"
            ? `${data.provider.totalEarnings}`
            : "0",
      },
      {
        title: "City",
        icon: locationPinImg,
        value: data?.defaultAddress?.city ?? "—",
      },
    ];
  }

  // client
  return [
    ...baseCards,
    {
      title: "Children",
      icon: kidImg,
      value: data?.children?.length ?? 0,
    },
    {
      title: "Total spend",
      icon: walletImg,
      value:
        typeof data?.orders?.totals?.totalSpend === "number"
          ? `${data.orders.totals.totalSpend}`
          : "0",
    },
    {
      title: "City",
      icon: locationPinImg,
      value: data?.defaultAddress?.city ?? "—",
    },
  ];
};
