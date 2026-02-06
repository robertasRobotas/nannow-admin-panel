import { UserDetails } from "@/types/Client";
import profileImg from "../assets/images/profile.svg";
import phoneImg from "../assets/images/phone.svg";
import locationPinImg from "../assets/images/location-pin.svg";
import idImg from "../assets/images/id.svg";
import shieldImg from "../assets/images/shield.svg";
import suspendedGreenImg from "../assets/images/suspended-green.svg";
import suspendedRedImg from "../assets/images/suspended-red.svg";
import kidImg from "../assets/images/kid-gray.svg";
import walletImg from "../assets/images/wallet.svg";
import type { StaticImageData } from "next/image";

export type InfoCard = {
  title: string;
  icon: StaticImageData;
  value: string | number;
  link?: string;
  booleanSwitch?: {
    value: boolean;
    onChange: () => void;
  };
};

export const getInfoCards = (
  data: UserDetails,
  mode: "client" | "provider",
  options?: {
    suspendedSwitch?: {
      value: boolean;
      onChange: () => void;
    };
  },
): InfoCard[] => {
  const isSuspended =
    options?.suspendedSwitch?.value ?? data?.user?.isSuspendedByAdmin ?? false;
  const baseCards: InfoCard[] = [
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
    {
      title: "Suspended status",
      icon: isSuspended ? suspendedRedImg : suspendedGreenImg,
      value: isSuspended ? "Suspended" : "Not suspended",
      booleanSwitch: options?.suspendedSwitch,
    },
  ];

  if (mode === "provider") {
    return [
      ...baseCards,
      {
        title: "Criminal record check",
        icon: shieldImg,
        value: data?.provider?.criminalRecord?.status ?? "—",
        link: `/criminal-check/${data?.user?.id}`,
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
      {
        title: "Stripe verified at",
        icon: locationPinImg,
        value: data?.provider?.stripeAccountVerifiedAt
          ? new Date(
              Number(data?.provider?.stripeAccountVerifiedAt) * 1000,
            ).toLocaleString()
          : "Not verified",
      },
      {
        title: "Availability status switched at",
        icon: locationPinImg,
        value: data?.provider?.isAvailableStatusChangedAt
          ? data?.provider?.isAvailableStatusChangedAt
          : "Not verified",
      },
      {
        title: "Is available now",
        icon: locationPinImg,
        value: data?.provider?.isAvailableStatus ? "YES" : "NO",
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
