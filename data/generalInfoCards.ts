import { UserDetails } from "@/types/Client";
import profileImg from "../assets/images/profile.svg";
import phoneImg from "../assets/images/phone.svg";
import locationPinImg from "../assets/images/location-pin.svg";
import calendarImg from "../assets/images/calendar.svg";
import idImg from "../assets/images/id.svg";
import shieldImg from "../assets/images/shield.svg";
import suspendedGreenImg from "../assets/images/suspended-green.svg";
import suspendedRedImg from "../assets/images/suspended-red.svg";
import kidImg from "../assets/images/kid-gray.svg";
import walletImg from "../assets/images/wallet.svg";
import emailAutoImg from "../assets/images/email-auto.svg";
import loginTypeImg from "../assets/images/login-type.svg";
import type { StaticImageData } from "next/image";
import { getCompensationRequestSummaryLines } from "@/data/compensationRequests";

export type InfoCard = {
  title: string;
  icon: StaticImageData;
  value: string | number;
  isWide?: boolean;
  cardLink?: string;
  alertDot?: boolean;
  valueLines?: {
    text: string;
    link?: string;
  }[];
  hideValue?: boolean;
  link?: string;
  linkValueText?: string;
  linkButtonTitle?: string;
  actionButton?: {
    title: string;
    action:
      | "DELETE_STRIPE"
      | "CHANGE_BASE_PRICE"
      | "BAN_USER"
      | "REBUILD_PUBLIC_URL";
  };
  booleanSwitch?: {
    value: boolean;
    onChange: () => void;
    disabled?: boolean;
  };
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatCompletionRate = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(2)}%`;
};

const formatCreditBalance = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `€ ${(value / 100).toFixed(2)}`;
};

const getCreditBalanceCents = (data: UserDetails) =>
  data?.user?.creditBalanceCents ??
  data?.client?.creditBalanceCents ??
  data?.provider?.creditBalanceCents;

const formatStripeDateTime = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "—";

  const date =
    typeof value === "number"
      ? new Date(value * 1000)
      : /^\d+$/.test(value)
        ? new Date(Number(value) * 1000)
        : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const formatTrackingPermissions = (
  value?: NonNullable<UserDetails["provider"]>["lastTrackingPermissions"],
) => {
  if (!value) {
    return {
      statusText: "status: —",
      modeText: "mode: —",
      reasonText: "reason: —",
      fgText: "fg permission: —",
      bgText: "bg permission: —",
      orderText: "order: —",
      orderLink: undefined as string | undefined,
      timeText: "time: —",
      updatedText: "updated: —",
    };
  }

  const orderId = value.orderId?.trim();

  return {
    statusText: `status: ${value.status ?? "—"}`,
    modeText: `mode: ${value.trackingMode ?? "—"}`,
    reasonText: `reason: ${value.reason ?? "—"}`,
    fgText: `fg permission: ${value.foregroundPermission?.status ?? "—"}`,
    bgText: `bg permission: ${value.backgroundPermission?.status ?? "—"}`,
    orderText: `order: ${orderId || "—"}`,
    orderLink: orderId ? `/orders/${orderId}` : undefined,
    timeText: `time: ${formatDateTime(value.timestamp)}`,
    updatedText: `updated: ${formatDateTime(value.updatedAt)}`,
  };
};

const hasTrackingPermissionsInfo = (
  value?: NonNullable<UserDetails["provider"]>["lastTrackingPermissions"],
) => {
  if (!value) return false;
  return Boolean(
    value.status ||
      value.trackingMode ||
      value.reason ||
      value.foregroundPermission?.status ||
      value.backgroundPermission?.status ||
      value.orderId ||
      value.timestamp ||
      value.updatedAt,
  );
};

const formatTrackingLocation = (
  value?: NonNullable<UserDetails["provider"]>["lastTrackingLocation"],
) => {
  if (!value) {
    return {
      latLngText: "lat: — | lng: —",
      accuracyText: "accuracy: —",
      timeText: "time: —",
      updatedText: "updated: —",
    };
  }

  const lat =
    typeof value.latitude === "number" && Number.isFinite(value.latitude)
      ? value.latitude.toFixed(6)
      : "—";
  const lng =
    typeof value.longitude === "number" && Number.isFinite(value.longitude)
      ? value.longitude.toFixed(6)
      : "—";
  const accuracy =
    typeof value.accuracy === "number" && Number.isFinite(value.accuracy)
      ? `${value.accuracy}m`
      : "—";

  return {
    latLngText: `lat: ${lat} | lng: ${lng}`,
    accuracyText: `accuracy: ${accuracy}`,
    timeText: `time: ${formatDateTime(value.timestamp)}`,
    updatedText: `updated: ${formatDateTime(value.updatedAt)}`,
  };
};

const hasTrackingLocationInfo = (
  value?: NonNullable<UserDetails["provider"]>["lastTrackingLocation"],
) => {
  if (!value) return false;
  return Boolean(
    (typeof value.latitude === "number" && Number.isFinite(value.latitude)) ||
      (typeof value.longitude === "number" && Number.isFinite(value.longitude)) ||
      (typeof value.accuracy === "number" && Number.isFinite(value.accuracy)) ||
      value.timestamp ||
      value.updatedAt,
  );
};

export const getInfoCards = (
  data: UserDetails,
  mode: "client" | "provider",
  options?: {
    suspendedSwitch?: {
      value: boolean;
      onChange: () => void;
      disabled?: boolean;
    };
    compensationRequestSwitch?: {
      value: boolean;
      onChange: () => void;
      disabled?: boolean;
    };
  },
): InfoCard[] => {
  const isSuspended =
    options?.suspendedSwitch?.value ?? data?.user?.isSuspendedByAdmin ?? false;
  const isOnboardingFinished =
    mode === "provider"
      ? data?.provider?.isOnboardingFinished ?? data?.user?.isOnboardingFinished
      : data?.client?.isOnboardingFinished ?? data?.user?.isOnboardingFinished;
  const newCriminalRecordStatus = data?.provider?.criminalRecord?.currentStatus;
  const criminalRecordApplications = data?.provider?.criminalRecord?.applications;
  const hasNewCriminalRecordFields =
    typeof newCriminalRecordStatus === "string" ||
    Array.isArray(criminalRecordApplications);
  const hasCriminalRecordApplications =
    Array.isArray(criminalRecordApplications) &&
    criminalRecordApplications.length > 0;
  const criminalRecordCardStatus =
    hasNewCriminalRecordFields &&
    hasCriminalRecordApplications &&
    newCriminalRecordStatus
      ? newCriminalRecordStatus
      : (data?.provider?.criminalRecordStatus ??
        newCriminalRecordStatus ??
        "NOT_SUBMITTED");

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
      title: "Email is auto generated",
      icon: emailAutoImg,
      value: data?.user?.isEmailAutoGenerated ? "YES" : "NO",
    },
    {
      title: "Onboarding finished",
      icon: shieldImg,
      value: isOnboardingFinished ? "YES" : "NO",
    },
    {
      title: "Login type",
      icon: loginTypeImg,
      value: data?.user?.userLoginMode ?? "—",
    },
    {
      title: "ID verification",
      icon: idImg,
      value: data?.user?.isUserVerified ? "Verified" : "Not verified",
    },
    {
      title: "Credit balance",
      icon: walletImg,
      value: formatCreditBalance(getCreditBalanceCents(data)),
    },
    {
      title: "Push token",
      icon: shieldImg,
      value: data?.user?.pushToken ?? "—",
    },
    {
      title: "App info",
      icon: loginTypeImg,
      value: `${data?.user?.platform ?? "—"} | ${data?.user?.appVersion ?? "—"}`,
    },
    {
      title: "Profile suspension",
      icon: isSuspended ? suspendedRedImg : suspendedGreenImg,
      value: isSuspended ? "Suspended" : "Not suspended",
      booleanSwitch: options?.suspendedSwitch,
    },
    {
      title: "Ban user",
      icon: suspendedRedImg,
      value: data?.user?.isBannedByAdmin ? "Banned" : "Not banned",
      actionButton: {
        title: data?.user?.isBannedByAdmin ? "Unban user" : "Ban user",
        action: "BAN_USER",
      },
    },
  ];

  if (mode === "provider") {
    const providerVideoUrl =
      data?.provider?.videoUrl?.trim() || data?.user?.videoUrl?.trim();
    const trackingPageLink =
      data?.provider?.id && data?.user?.id
        ? `/provider/${data.provider.id}/tracking?providerUserId=${data.user.id}`
        : undefined;
    const trackingLocation = formatTrackingLocation(
      data?.provider?.lastTrackingLocation,
    );
    const trackingPermissions = formatTrackingPermissions(
      data?.provider?.lastTrackingPermissions,
    );
    const showTrackingPermissionsCard = hasTrackingPermissionsInfo(
      data?.provider?.lastTrackingPermissions,
    );
    const showTrackingLocationCard = hasTrackingLocationInfo(
      data?.provider?.lastTrackingLocation,
    );

    return [
      ...baseCards,
      {
        title: "Criminal record check",
        icon: shieldImg,
        value: criminalRecordCardStatus,
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
        title: "Public profile URL",
        icon: profileImg,
        isWide: true,
        value: data?.provider?.publicUrl ?? "—",
        ...(data?.provider?.publicUrl
          ? {
              link: data.provider.publicUrl,
              linkValueText: data.provider.publicUrl,
              linkButtonTitle: "Open profile",
            }
          : {}),
        actionButton: {
          title: "Rebuild URL",
          action: "REBUILD_PUBLIC_URL",
        },
      },
      {
        title: "Order completion stats",
        icon: walletImg,
        isWide: true,
        value: formatCompletionRate(data?.provider?.orderCompletionRate),
        valueLines: [
          {
            text: `Accepted: ${
              typeof data?.provider?.acceptedOrdersCount === "number"
                ? data.provider.acceptedOrdersCount
                : 0
            }`,
          },
          {
            text: `Finished: ${
              typeof data?.provider?.finishedAcceptedOrdersCount === "number"
                ? data.provider.finishedAcceptedOrdersCount
                : 0
            }`,
          },
          {
            text: `Canceled by provider: ${
              typeof data?.provider?.canceledByProviderAcceptedOrdersCount ===
              "number"
                ? data.provider.canceledByProviderAcceptedOrdersCount
                : 0
            }`,
          },
          {
            text: `Completion rate: ${formatCompletionRate(
              data?.provider?.orderCompletionRate,
            )}`,
          },
        ],
      },
      {
        title: "Base price",
        icon: walletImg,
        value:
          typeof data?.provider?.baseProviderRate === "number"
            ? `€ ${data.provider.baseProviderRate.toFixed(2)}`
            : "—",
        actionButton: {
          title: "Change",
          action: "CHANGE_BASE_PRICE",
        },
      },
      {
        title: "Final price",
        icon: walletImg,
        value:
          typeof data?.provider?.finalPrice === "number"
            ? `€ ${data.provider.finalPrice.toFixed(2)}`
            : "—",
      },
      {
        title: "Price calculation method",
        icon: walletImg,
        value: data?.provider?.providerPriceCalculationMethod ?? "—",
      },
      ...(providerVideoUrl
        ? [
            {
              title: "Profile video",
              icon: profileImg,
              value: providerVideoUrl,
              link: providerVideoUrl,
              linkValueText: "Video link",
              linkButtonTitle: "Open video",
            } satisfies InfoCard,
          ]
        : []),
      {
        title: "City",
        icon: locationPinImg,
        value: data?.defaultAddress?.city ?? "—",
      },
      {
        title: "Stripe verified at",
        icon: locationPinImg,
        value: data?.provider?.stripeAccountVerifiedAt
          ? formatStripeDateTime(data?.provider?.stripeAccountVerifiedAt)
          : "Not verified",
        actionButton: {
          title: "Delete Stripe acc",
          action: "DELETE_STRIPE",
        },
      },
      {
        title: "Provider timestamps",
        icon: calendarImg,
        isWide: true,
        value: formatDateTime(data?.provider?.createdAt),
        valueLines: [
          { text: `Created at: ${formatDateTime(data?.provider?.createdAt)}` },
          { text: `Updated at: ${formatDateTime(data?.provider?.updatedAt)}` },
        ],
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
      {
        title: "Tracking status",
        icon: locationPinImg,
        value: data?.provider?.trackingStatus ?? "—",
      },
      {
        title: "Tracking mode",
        icon: locationPinImg,
        value: data?.provider?.trackingMode ?? "—",
      },
      {
        title: "Tracking reason",
        icon: locationPinImg,
        value: data?.provider?.trackingReason ?? "—",
      },
      {
        title: "Tracking updated at",
        icon: locationPinImg,
        value: formatDateTime(data?.provider?.trackingUpdatedAt),
      },
      ...(showTrackingPermissionsCard
        ? [
            {
              title: "Last tracking permissions",
              icon: locationPinImg,
              isWide: true,
              value: trackingPermissions.statusText,
              valueLines: [
                { text: trackingPermissions.statusText },
                { text: trackingPermissions.modeText },
                { text: trackingPermissions.reasonText },
                { text: trackingPermissions.fgText },
                { text: trackingPermissions.bgText },
                {
                  text: trackingPermissions.orderText,
                  link: trackingPermissions.orderLink,
                },
                { text: trackingPermissions.timeText },
                { text: trackingPermissions.updatedText },
              ],
            } satisfies InfoCard,
          ]
        : []),
      ...(showTrackingLocationCard
        ? [
            {
              title: "Last tracking location",
              icon: locationPinImg,
              isWide: true,
              value: trackingLocation.latLngText,
              valueLines: [
                {
                  text: trackingLocation.latLngText,
                  link: trackingPageLink,
                },
                { text: trackingLocation.accuracyText },
                { text: trackingLocation.timeText },
                { text: trackingLocation.updatedText },
              ],
            } satisfies InfoCard,
          ]
        : []),
    ];
  }

  // client
  const compensationSummary = getCompensationRequestSummaryLines(data?.client);
  const hasCompensationAlert = compensationSummary.hasAlert;
  return [
    ...baseCards,
    {
      title: "Compensation request",
      icon: walletImg,
      value: "Requests",
      valueLines: compensationSummary.lines,
      cardLink: data?.user?.id
        ? `/client/${data.user.id}/compensation-requests`
        : undefined,
      alertDot: hasCompensationAlert,
    },
    {
      title: "Client timestamps",
      icon: calendarImg,
      isWide: true,
      value: formatDateTime(data?.client?.createdAt),
      valueLines: [
        { text: `Created at: ${formatDateTime(data?.client?.createdAt)}` },
        { text: `Updated at: ${formatDateTime(data?.client?.updatedAt)}` },
      ],
    },
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
