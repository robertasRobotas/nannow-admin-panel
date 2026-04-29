import { useState } from "react";
import { useRouter } from "next/router";
import { DetailedOrderType } from "@/types/DetailedOrder";
import { OrderStatusEnum } from "@/types/OrderStatusEnum";
import styles from "./detailedOrder.module.css";
import { nunito } from "@/helpers/fonts";
import defaultUserImg from "../../../assets/images/default-avatar.png";
import ProfileHeading from "./ProfileHeading/ProfileHeading";
import flashImg from "../../../assets/images/flash-gray.svg";
import { getOrderStatusTitle, normalizeOrderStatus } from "@/data/orderStatusOptions";
import InfoCard from "./InfoCard/InfoCard";
import locationPinImg from "../../../assets/images/location-gray.svg";
import arriveImg from "../../../assets/images/arrival-gray.svg";
import childrenImg from "../../../assets/images/kid-gray.svg";
import { useMediaQuery } from "react-responsive";
import PriceSummary from "./PriceSummary/PriceSummary";
import Button from "@/components/Button/Button";
import ProcessCard from "./ProcessCard/ProcessCard";
import {
  cancelOrderByAdmin,
  closeOrderByAdmin,
  finishOrderByAdmin,
  getInvoicePdf,
  getOrderInvoice,
  getOrderProviderInvoice,
  getOrderProviderReceipt,
  openOrderByAdmin,
  payoutAdditionalPaymentsByOrderId,
  payoutCancelFeeByOrderId,
  refundOrderById,
  releaseFundsByOrderId,
  updateOrderStatusByAdmin,
} from "@/pages/api/fetch";
import documentImg from "../../../assets/images/doc.svg";
import calendarImg from "../../../assets/images/calendar.svg";
import cardBwImg from "../../../assets/images/card-bw.svg";
import Review from "@/components/Reviews/ReviewsList/Review/Review";
import callImg from "../../../assets/images/call.svg";
import closeImg from "../../../assets/images/close.svg";
import crossRedImg from "../../../assets/images/cross-red.svg";

type DetailedOrderProps = {
  order: DetailedOrderType;
};

const DetailedOrder = ({ order }: DetailedOrderProps) => {
  const router = useRouter();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isReleaseFundsErrorModalOpen, setIsReleaseFundsErrorModalOpen] =
    useState(false);
  const [isCloseOrderModalOpen, setIsCloseOrderModalOpen] = useState(false);
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false);
  const [isStatusConfirmModalOpen, setIsStatusConfirmModalOpen] =
    useState(false);
  const [releaseFundsErrorMessage, setReleaseFundsErrorMessage] =
    useState<string>("");
  const [releaseFundsErrorDetails, setReleaseFundsErrorDetails] = useState<
    string | null
  >(null);
  const [isReleasingFunds, setIsReleasingFunds] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [problemNote, setProblemNote] = useState(
    order?.providerIgnoredEndNotificationResolvedReason ?? "No notes yet",
  );
  const [isProblemMenuOpen, setIsProblemMenuOpen] = useState(false);
  const [isFinishingOrder, setIsFinishingOrder] = useState(false);
  const [isCancelingOrder, setIsCancelingOrder] = useState(false);
  const [isTogglingClosedByAdmin, setIsTogglingClosedByAdmin] = useState(false);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState(
    normalizeOrderStatus(order?.status),
  );
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [isProviderInvoiceLoading, setIsProviderInvoiceLoading] =
    useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isPayingCancelFee, setIsPayingCancelFee] = useState(false);
  const [isPayingAdditionalPayments, setIsPayingAdditionalPayments] =
    useState(false);
  const [openingAdditionalPaymentInvoiceId, setOpeningAdditionalPaymentInvoiceId] =
    useState<string | null>(null);
  const [problemStatus, setProblemStatus] = useState(order?.status);
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  const finishOrder = async (resolvedReason: string) => {
    if (isFinishingOrder) return;
    try {
      setIsFinishingOrder(true);
      const response = await finishOrderByAdmin(order.id, resolvedReason);
      if (response.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to finish order", error);
    } finally {
      setIsFinishingOrder(false);
      setIsProblemMenuOpen(false);
    }
  };

  const cancelOrder = async () => {
    if (isCancelingOrder) return;
    try {
      setIsCancelingOrder(true);
      const response = await cancelOrderByAdmin(order.id);
      if (response.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to cancel order", error);
    } finally {
      setIsCancelingOrder(false);
      setIsProblemMenuOpen(false);
    }
  };

  const getUserImage = (imgUrl?: string) =>
    imgUrl && imgUrl.length > 0 ? imgUrl : defaultUserImg.src;

  const getUserName = (name?: string, lastName?: string) =>
    `${name ?? "Deleted"} ${lastName ?? "User"}`;

  const requiredDirectProvider =
    order?.isDirectOrderToProvider &&
    !!order?.requiredProvider &&
    !order?.approvedProvider &&
    !order?.approvedProviderId
      ? order.requiredProvider
      : null;
  const sitterUser = order?.approvedProvider ?? requiredDirectProvider;
  const parentUser = order?.clientUser;

  const parentLocation = `${order?.address?.street ?? "Unknown"} ${
    order?.address?.houseNumber ?? ""
  }, ${order?.address?.city ?? ""}`;

  const formatCompactDateTime = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZoneName: "short",
        })
      : "-";
  const formatTimeOnly = (value?: string | null) =>
    value
      ? new Date(value).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "-";
  const formatDateOnly = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "-";

  const orderCreatedAt = formatCompactDateTime(order?.createdAt);
  const normalizedOrderType = String(order?.orderType ?? "").toUpperCase();
  const isRepetitiveOrderType = normalizedOrderType === "REPETITIVE";
  const arrivalTime = isRepetitiveOrderType
    ? formatTimeOnly(order?.startsAt)
    : formatCompactDateTime(order?.startsAt);
  const leaveTime = isRepetitiveOrderType
    ? formatTimeOnly(order?.endsAt)
    : formatCompactDateTime(order?.endsAt);
  const paidAtText = formatCompactDateTime(order?.paidAt);
  const providerSelectionReminder1SentAtText = formatCompactDateTime(
    order?.providerSelectionReminder1SentAt,
  );
  const providerSelectionReminder2SentAtText = formatCompactDateTime(
    order?.providerSelectionReminder2SentAt,
  );
  const providerSelectionAutoCancelWarnedAtText = formatCompactDateTime(
    order?.providerSelectionAutoCancelWarnedAt,
  );
  const hasProviderSelectionReminderInfo =
    !!order?.providerSelectionReminder1SentAt ||
    !!order?.providerSelectionReminder2SentAt ||
    !!order?.providerSelectionAutoCancelWarnedAt;
  const unfinishedOrderReminderLastEmailSentAtText = formatCompactDateTime(
    order?.unfinishedOrderReminderLastEmailSentAt,
  );
  const hasUnfinishedOrderReminderInfo =
    !!order?.unfinishedOrderReminderLastEmailSentAt ||
    order?.unfinishedOrderReminderEmailCount != null;

  const providerMarkedServiceInProgressAt =
    order?.provider_markedAsServiceInProgressAt
      ? new Date(order?.provider_markedAsServiceInProgressAt).toLocaleString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZoneName: "short",
          },
        )
      : "-";

  const providerMarkedServiceEndedAt = order?.provider_markedAsServiceEndedAt
    ? new Date(order?.provider_markedAsServiceEndedAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      })
    : "-";

  const childrenNames = order?.children.map((c) => c.name).join(", ");
  const pendingProviders = order?.pendingProviders ?? [];

  const payOrderHandler = () => {
    setIsConfirmModalOpen(true);
  };

  const extractReleaseFundsError = (error: unknown) => {
    const fallback = {
      message: "Failed to release funds",
      details: null as string | null,
    };

    if (typeof error !== "object" || error === null) return fallback;

    const maybeResponse = (error as { response?: unknown }).response;
    if (typeof maybeResponse !== "object" || maybeResponse === null) {
      return fallback;
    }

    const maybeData = (maybeResponse as { data?: unknown }).data;
    if (typeof maybeData !== "object" || maybeData === null) {
      return fallback;
    }

    const payload = maybeData as { error?: unknown; details?: unknown };
    const message =
      typeof payload.error === "string" && payload.error.trim().length > 0
        ? payload.error
        : fallback.message;
    const details =
      typeof payload.details === "string" && payload.details.trim().length > 0
        ? payload.details
        : null;

    return { message, details };
  };

  const confirmPayOrder = async () => {
    try {
      setIsReleasingFunds(true);
      const response = await releaseFundsByOrderId(order.id);
      if (response.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.warn("Failed to release funds");
      const parsedError = extractReleaseFundsError(error);
      setReleaseFundsErrorMessage(parsedError.message);
      setReleaseFundsErrorDetails(parsedError.details);
      setIsReleaseFundsErrorModalOpen(true);
    } finally {
      setIsReleasingFunds(false);
      setIsConfirmModalOpen(false);
    }
  };

  const refundParent = async () => {
    if (isRefunding) return;
    try {
      setIsRefunding(true);
      const response = await refundOrderById(order.id);
      if (response.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to refund order", error);
    } finally {
      setIsRefunding(false);
    }
  };

  const payoutCancelFee = async () => {
    if (isPayingCancelFee) return;
    try {
      setIsPayingCancelFee(true);
      const response = await payoutCancelFeeByOrderId(order.id);
      if (response.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to payout cancel fee", error);
    } finally {
      setIsPayingCancelFee(false);
    }
  };

  const payoutAdditionalPayments = async () => {
    if (isPayingAdditionalPayments) return;
    try {
      setIsPayingAdditionalPayments(true);
      const response = await payoutAdditionalPaymentsByOrderId(order.id);
      if (response.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to payout additional payments", error);
    } finally {
      setIsPayingAdditionalPayments(false);
    }
  };

  const closeConfirmModal = () => setIsConfirmModalOpen(false);
  const closeOrderModal = () => setIsCloseOrderModalOpen(false);
  const closeStatusSelector = () => {
    if (isUpdatingOrderStatus) return;
    setSelectedOrderStatus(normalizeOrderStatus(problemStatus));
    setIsStatusSelectorOpen(false);
  };

  const openStatusSelector = () => {
    setSelectedOrderStatus(normalizeOrderStatus(problemStatus));
    setIsStatusSelectorOpen(true);
  };

  const openStatusConfirmModal = () => {
    if (selectedOrderStatus === normalizeOrderStatus(problemStatus)) return;
    setIsStatusSelectorOpen(false);
    setIsStatusConfirmModalOpen(true);
  };

  const confirmOrderStatusChange = async () => {
    if (isUpdatingOrderStatus) return;
    try {
      setIsUpdatingOrderStatus(true);
      const response = await updateOrderStatusByAdmin(order.id, selectedOrderStatus);
      if (response.status === 200) {
        setProblemStatus(selectedOrderStatus);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to update order status", error);
    } finally {
      setIsUpdatingOrderStatus(false);
      setIsStatusConfirmModalOpen(false);
    }
  };

  const toggleClosedByAdmin = async () => {
    if (isTogglingClosedByAdmin) return;
    try {
      setIsTogglingClosedByAdmin(true);
      const response = order?.isClosedByAdmin
        ? await openOrderByAdmin(order.id)
        : await closeOrderByAdmin(order.id);
      if (response.status === 200) {
        router.push("/orders");
      }
    } catch (error) {
      console.error("Failed to toggle order closed state", error);
    } finally {
      setIsTogglingClosedByAdmin(false);
      setIsCloseOrderModalOpen(false);
    }
  };

  const openOrderInvoice = async () => {
    if (isInvoiceLoading) return;
    try {
      setIsInvoiceLoading(true);
      const response = await getOrderInvoice(order.id);
      const pdfBlob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);

      const opened = window.open(blobUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error("Failed to get invoice", error);
    } finally {
      setIsInvoiceLoading(false);
    }
  };

  const openProviderInvoice = async () => {
    if (isProviderInvoiceLoading) return;
    try {
      setIsProviderInvoiceLoading(true);
      const response = await getOrderProviderInvoice(order.id);
      const pdfBlob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);

      const opened = window.open(blobUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error("Failed to get provider invoice", error);
    } finally {
      setIsProviderInvoiceLoading(false);
    }
  };

  const openProviderReceipt = async () => {
    if (isProviderInvoiceLoading) return;
    try {
      setIsProviderInvoiceLoading(true);
      const response = await getOrderProviderReceipt(order.id);
      const pdfBlob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);

      const opened = window.open(blobUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error("Failed to get provider receipt", error);
    } finally {
      setIsProviderInvoiceLoading(false);
    }
  };

  const openPdfBlobInNewTab = (data: BlobPart | Blob) => {
    const pdfBlob =
      data instanceof Blob ? data : new Blob([data], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(pdfBlob);

    const opened = window.open(blobUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  };

  const openAdditionalPaymentInvoice = async (invoiceId: string) => {
    if (openingAdditionalPaymentInvoiceId) return;
    try {
      setOpeningAdditionalPaymentInvoiceId(invoiceId);
      const response = await getInvoicePdf(invoiceId);
      openPdfBlobInNewTab(response.data);
    } catch (error) {
      console.error("Failed to get additional payment invoice", error);
    } finally {
      setOpeningAdditionalPaymentInvoiceId(null);
    }
  };

  const openOrderInvoicesPage = () => {
    window.open(`/invoices?orderId=${order.id}`, "_blank", "noopener,noreferrer");
  };

  const getAdditionalPaymentInvoiceTitle = (invoice: {
    ownerRole?: string | null;
    kind?: string | null;
    invoiceNo?: string | null;
  }) => {
    const role = String(invoice.ownerRole ?? "").toUpperCase();
    const kind = String(invoice.kind ?? "").toUpperCase();

    if (role === "CLIENT" && kind === "PLATFORM_FEE_INVOICE") {
      return "Client platform fee invoice";
    }

    if (role === "CLIENT" && kind === "PROVIDER_RECEIPT") {
      return "Client provider receipt";
    }

    if (role === "CLIENT" && kind === "PROVIDER_INVOICE") {
      return "Client provider invoice";
    }

    if (role === "PROVIDER" && kind === "PROVIDER_RECEIPT") {
      return "Provider receipt";
    }

    if (role === "PROVIDER" && kind === "PROVIDER_INVOICE") {
      return "Provider invoice";
    }

    return invoice.invoiceNo ? `Invoice ${invoice.invoiceNo}` : "Open invoice";
  };

  const releasedFundsAt = order?.releasedFundsToProviderAt
    ? new Date(order.releasedFundsToProviderAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      })
    : "-";

  const refundedAmountValue =
    typeof order?.refundedAmount === "number"
      ? order.refundedAmount
      : typeof order?.refundedAmountCents === "number"
        ? order.refundedAmountCents / 100
        : null;
  const cancelFeeAmountValue =
    typeof order?.cancelFeeAmount === "number"
      ? order.cancelFeeAmount
      : typeof order?.cancelFeeAmountCents === "number"
        ? order.cancelFeeAmountCents / 100
        : null;

  const getProviderName = (fullName: string) => {
    const isProviderNotSelected = !sitterUser;
    return isProviderNotSelected ? "Not selected yet" : fullName;
  };

  const hasProviderActivityNumber = Boolean(
    order?.approvedProvider?.activityNumber || order?.approvedProvider?.activityNo,
  );
  const shouldShowOrderTypeCard =
    normalizedOrderType === "CONTINUOUS" || normalizedOrderType === "REPETITIVE";
  const selectedDays = Array.isArray(order?.selectedDays)
    ? order.selectedDays.filter((day): day is string => typeof day === "string")
    : [];
  const shouldShowSelectedDaysCard =
    normalizedOrderType === "REPETITIVE" && selectedDays.length > 0;
  const orderStatusUpper = normalizeOrderStatus(order?.status);
  const isCanceledOrder = orderStatusUpper.includes("CANCELED");
  const isCanceledByClient = orderStatusUpper === "CANCELED_BY_CLIENT";
  const isCanceledByProvider = orderStatusUpper === "CANCELED_BY_PROVIDER";
  const isCanceledByAdmin = orderStatusUpper === "CANCELED_BY_ADMIN";
  const isRefundableCanceledOrder =
    isCanceledByClient || isCanceledByProvider || isCanceledByAdmin;
  const isCanceledLate2h =
    isCanceledByClient && !!order?.isOrderCanceledLessThan2hBeforeStart;
  const isCanceledLate12h =
    isCanceledByClient &&
    !!order?.isOrderCanceledLessThan12hBeforeStart &&
    !isCanceledLate2h;
  const cancelTimingStatus = isCanceledLate2h
    ? "Canceled less than 2h before start"
    : isCanceledLate12h
      ? "Canceled less than 12h before start"
      : null;

  const formatCents = (value?: number | null) =>
    typeof value === "number" ? `€${(value / 100).toFixed(2)}` : "-";
  const formatMoney = (value?: number | null) =>
    typeof value === "number" ? `€${value.toFixed(2)}` : "-";
  const formatCurrencyAmount = (
    value?: number | null,
    currency?: string | null,
  ) =>
    typeof value === "number"
      ? `${value.toFixed(2)} ${String(currency ?? "EUR").toUpperCase()}`
      : "-";
  const additionalPayments = Array.isArray(order?.additionalPayments)
    ? order.additionalPayments
    : [];
  const hasAdditionalPayments = additionalPayments.length > 0;
  const hasPendingAdditionalPayout =
    (order?.additionalPaymentsSummary?.payoutPendingCount ?? 0) > 0 ||
    additionalPayments.some(
      (payment) => String(payment?.payoutState ?? "").toUpperCase() === "PENDING",
    );
  const requiresRefund =
    isCanceledByAdmin ||
    isCanceledByProvider ||
    (isCanceledByClient && !isCanceledLate12h && !isCanceledLate2h);
  const requiresCancelFeePayout = isCanceledLate12h || isCanceledLate2h;
  const providerCostAmount =
    typeof order?.totalProviderPrice === "number" ? order.totalProviderPrice : null;
  const serviceFeeAmount =
    typeof order?.platformFeePrice === "number" ? order.platformFeePrice : null;
  const calculatedCancelFeeAmount = isCanceledLate12h
    ? providerCostAmount != null
      ? providerCostAmount * 0.2
      : null
    : isCanceledLate2h
      ? providerCostAmount
      : null;
  const cancelFeeDisplayAmount =
    cancelFeeAmountValue != null
      ? cancelFeeAmountValue
      : calculatedCancelFeeAmount;
  const totalOrderAmount =
    typeof order?.totalPrice === "number" ? order.totalPrice : null;
  const refundDisplayAmount =
    refundedAmountValue != null
      ? refundedAmountValue
      : isCanceledByProvider || isCanceledByAdmin
        ? totalOrderAmount
        : isCanceledByClient
          ? isCanceledLate12h
            ? totalOrderAmount != null
              ? Math.max(
                  totalOrderAmount -
                    (serviceFeeAmount ?? 0) -
                    (cancelFeeDisplayAmount ?? 0),
                  0,
                )
              : null
            : requiresRefund
              ? totalOrderAmount
              : null
          : null;
  const shouldShowInvoiceCards =
    order?.status === "PROVIDER_MARKED_AS_SERVICE_ENDED" || requiresCancelFeePayout;
  const shouldShowProviderDocumentCard =
    shouldShowInvoiceCards &&
    !!order?.approvedProviderId;
  const isOrderPaid = String(order?.paymentStatus ?? "").toUpperCase() === "PAID";
  const isRejectedDirectOffer =
    orderStatusUpper === "PROVIDER_REJECTED_DIRECT_OFFER";
  const isCanceledNotPaidByClient =
    orderStatusUpper === "CANCELED_NOT_PAID_BY_CLIENT";
  const hasSpecialProcessStatus =
    isRejectedDirectOffer || isCanceledNotPaidByClient;
  const isRefundDone = !!order?.refundedAt;
  const isCancelFeeDone = !!order?.isCancelFeePaidToProvider;
  const statusTitle =
    getOrderStatusTitle(problemStatus, order?.isDirectOrderToProvider) || "-";
  const orderStatusOptions = Object.values(OrderStatusEnum);
  const selectedOrderStatusTitle =
    getOrderStatusTitle(selectedOrderStatus, order?.isDirectOrderToProvider) ||
    selectedOrderStatus;
  const currentOrderStatusTitle =
    getOrderStatusTitle(problemStatus, order?.isDirectOrderToProvider) || "-";
  const specialProcessImgUrl = isRejectedDirectOffer
    ? getUserImage(sitterUser?.user?.imgUrl)
    : getUserImage(parentUser?.imgUrl);
  const areCanceledFinancialActionsDone = isCanceledByAdmin
    ? isRefundDone
    : isCanceledByClient
    ? isCanceledLate2h
      ? isCancelFeeDone
      : isCanceledLate12h
        ? isRefundDone && isCancelFeeDone
        : isRefundDone
    : isCanceledByProvider
      ? isRefundDone
      : true;
  const refundedAtText = order?.refundedAt
    ? new Date(order.refundedAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      })
    : "-";
  const cancelFeePaidAtText = order?.cancelFeePaidToProviderAt
    ? new Date(order.cancelFeePaidToProviderAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      })
    : "-";
  const finalPrimaryTitle = isCanceledOrder
    ? requiresRefund || isCanceledLate12h
      ? isRefundDone
        ? "Refunded to parent"
        : "Refund to parent"
      : isCanceledByClient
        ? "Cancel fee to sitter"
        : "Canceled order payments"
    : "Final price to pay the sitter";
  const finalPrimaryValue = isCanceledOrder
    ? requiresRefund || isCanceledLate12h
      ? refundDisplayAmount != null
        ? `€${refundDisplayAmount.toFixed(2)}`
        : "—"
      : isCanceledByClient
        ? cancelFeeDisplayAmount != null
          ? `€${cancelFeeDisplayAmount.toFixed(2)}`
          : "—"
        : `€${order?.totalProviderPrice?.toFixed(2) ?? "-"}`
    : `€${order?.totalProviderPrice?.toFixed(2) ?? "-"}`;
  const showCanceledFeeBreakdown =
    isCanceledByClient &&
    (requiresRefund || isCanceledLate12h) &&
    cancelFeeDisplayAmount != null;

  return (
    <div className={styles.main}>
      <div className={styles.orderWrapper}>
        <div className={`${styles.title} ${nunito.className}`}>
          Order details
        </div>
        <ProfileHeading
          sitterName={getProviderName(
            getUserName(
              sitterUser?.user?.firstName,
              sitterUser?.user?.lastName,
            ),
          )}
          sitterImgUrl={getUserImage(sitterUser?.user?.imgUrl)}
          parentName={getUserName(parentUser?.firstName, parentUser?.lastName)}
          parentImgUrl={getUserImage(parentUser?.imgUrl)}
          sitterPhoneNo={sitterUser?.user?.phoneNumber ?? ""}
          parentPhoneNo={parentUser?.phoneNumber ?? ""}
          sitterProfileHref={
            sitterUser?.userId ? `/provider/${sitterUser.userId}` : undefined
          }
          parentProfileHref={
            order?.clientUserId ? `/client/${order.clientUserId}` : undefined
          }
        />
        <div className={styles.orderInfo}>
          <InfoCard
            title="Order created at"
            iconImgUrl={calendarImg.src}
            type={isMobile ? "SPAN2" : "SPAN2"}
            info={orderCreatedAt}
          />
          <InfoCard
            title="Order ID"
            iconImgUrl={documentImg.src}
            type={isMobile ? "SPAN2" : "SPAN2"}
            info={order.orderPrettyId}
          />
          <InfoCard
            title="Status"
            iconImgUrl={flashImg.src}
            type={isMobile ? "SPAN1" : "SPAN3"}
            action={
              <Button
                title="Change"
                type="OUTLINED"
                height={32}
                className={styles.statusChangeButton}
                isDisabled={isUpdatingOrderStatus}
                onClick={openStatusSelector}
              />
            }
            info={
              <>
                <div>{statusTitle}</div>
                {order?.isProviderIgnoredEndNotification && (
                  <div className={styles.statusAttention}>
                    Provider ignored end notification
                  </div>
                )}
              </>
            }
          />
          {order?.isUrgent && (
            <InfoCard
              title="Priority"
              iconImgUrl={flashImg.src}
              type={isMobile ? "SPAN1" : "SPAN1"}
              info={<span className={styles.urgentMark}>Urgent</span>}
            />
          )}
          {cancelTimingStatus && (
            <InfoCard
              title="Canceled timing"
              iconImgUrl={flashImg.src}
              type={isMobile ? "SPAN1" : "SPAN2"}
              info={cancelTimingStatus}
            />
          )}
          <InfoCard
            title="Parent location"
            iconImgUrl={locationPinImg.src}
            type={isMobile ? "SPAN1" : "SPAN3"}
            info={parentLocation}
          />
          {shouldShowOrderTypeCard && (
            <InfoCard
              title="Order type"
              iconImgUrl={calendarImg.src}
              type={isMobile ? "SPAN2" : "SPAN2"}
              info={normalizedOrderType}
            />
          )}
          {shouldShowSelectedDaysCard && (
            <InfoCard
              title="Selected days"
              iconImgUrl={calendarImg.src}
              type={isMobile ? "SPAN2" : "SPAN3"}
              isCentered={true}
              info={
                <div className={styles.stripeInfoList}>
                  {selectedDays.map((day, index) => (
                    <div key={`${day}-${index}`}>{formatDateOnly(day)}</div>
                  ))}
                </div>
              }
            />
          )}
          <InfoCard
            title="Time"
            iconImgUrl={arriveImg.src}
            type={isMobile ? "SPAN2" : "SPAN2"}
            info={
              <div className={styles.stripeInfoList}>
                <div>
                  <span className={styles.stripeInfoLabel}>Arrival:</span>{" "}
                  {arrivalTime}
                </div>
                <div>
                  <span className={styles.stripeInfoLabel}>Leaving:</span>{" "}
                  {leaveTime}
                </div>
              </div>
            }
          />
          <InfoCard
            title="Children"
            iconImgUrl={childrenImg.src}
            type={isMobile ? "SPAN2" : "SPAN2"}
            info={childrenNames}
          />
          {hasProviderSelectionReminderInfo && (
            <InfoCard
              title="Provider selection reminders"
              iconImgUrl={calendarImg.src}
              type={isMobile ? "SPAN2" : "SPAN3"}
              isMultiline={true}
              info={
                <div className={styles.stripeInfoList}>
                  {!!order?.providerSelectionReminder1SentAt && (
                    <div>
                      <span className={styles.stripeInfoLabel}>Reminder 1:</span>{" "}
                      {providerSelectionReminder1SentAtText}
                    </div>
                  )}
                  {!!order?.providerSelectionReminder2SentAt && (
                    <div>
                      <span className={styles.stripeInfoLabel}>Reminder 2:</span>{" "}
                      {providerSelectionReminder2SentAtText}
                    </div>
                  )}
                  {!!order?.providerSelectionAutoCancelWarnedAt && (
                    <div>
                      <span className={styles.stripeInfoLabel}>
                        Auto-cancel warning:
                      </span>{" "}
                      {providerSelectionAutoCancelWarnedAtText}
                    </div>
                  )}
                </div>
              }
            />
          )}
          {hasUnfinishedOrderReminderInfo && (
            <InfoCard
              title="Unfinished order reminder"
              iconImgUrl={calendarImg.src}
              type={isMobile ? "SPAN2" : "SPAN3"}
              info={
                <div className={styles.stripeInfoList}>
                  {!!order?.unfinishedOrderReminderLastEmailSentAt && (
                    <div>
                      <span className={styles.stripeInfoLabel}>
                        Last email sent:
                      </span>{" "}
                      {unfinishedOrderReminderLastEmailSentAtText}
                    </div>
                  )}
                  {order?.unfinishedOrderReminderEmailCount != null && (
                    <div>
                      <span className={styles.stripeInfoLabel}>
                        Email count:
                      </span>{" "}
                      {order.unfinishedOrderReminderEmailCount}
                    </div>
                  )}
                </div>
              }
            />
          )}
          {shouldShowInvoiceCards && (
            <InfoCard
              title="Invoice from nannow"
              iconImgUrl={documentImg.src}
              type={isMobile ? "SPAN2" : "SPAN1"}
              info={
                <Button
                  title={
                    order?.invoiceDate ? "Open invoice" : "Generate invoice"
                  }
                  type="OUTLINED"
                  onClick={openOrderInvoice}
                  alignBaseline={true}
                  isLoading={isInvoiceLoading}
                  isDisabled={isInvoiceLoading}
                />
              }
            />
          )}
          {shouldShowProviderDocumentCard && (
              <InfoCard
                title={
                  hasProviderActivityNumber
                    ? "Invoice from provider"
                    : "Receipt from provider"
                }
                iconImgUrl={documentImg.src}
                type={isMobile ? "SPAN2" : "SPAN1"}
                info={
                  <Button
                    title={
                      hasProviderActivityNumber
                        ? order?.invoiceDate
                          ? "Open invoice"
                          : "Generate invoice"
                        : order?.invoiceDate
                          ? "Open receipt"
                          : "Generate receipt"
                    }
                    type="OUTLINED"
                    onClick={
                      hasProviderActivityNumber
                        ? openProviderInvoice
                        : openProviderReceipt
                    }
                    alignBaseline={true}
                    isLoading={isProviderInvoiceLoading}
                    isDisabled={isProviderInvoiceLoading}
                  />
                }
              />
          )}
          {!!order?.paidAt && (
            <InfoCard
              title="Stripe data"
              iconImgUrl={cardBwImg.src}
              type={isMobile ? "SPAN2" : "SPAN3"}
              isMultiline={true}
              info={
                <div className={styles.stripeInfoList}>
                  <div>
                    <span className={styles.stripeInfoLabel}>Paid:</span>{" "}
                    {paidAtText}
                  </div>
                  <div>
                    <span className={styles.stripeInfoLabel}>Customer:</span>{" "}
                    {order?.stripeCustomerId || "-"}
                  </div>
                  <div>
                    <span className={styles.stripeInfoLabel}>Description:</span>{" "}
                    {order?.stripePaymentDescription || "-"}
                  </div>
                </div>
              }
            />
          )}
        </div>
        {pendingProviders.length > 0 && (
          <div className={styles.pendingProvidersSection}>
            <div className={`${styles.title} ${nunito.className}`}>
              Pending providers
            </div>
            <div className={styles.pendingProvidersList}>
              {pendingProviders.map((provider, index) => (
                <button
                  type="button"
                  key={`${provider.id}-${index}`}
                  className={styles.pendingProviderCard}
                  onClick={() => {
                    window.open(`/provider/${provider.userId}`, "_blank");
                  }}
                >
                  <span className={styles.pendingProviderAvatarBtn}>
                    <img
                      src={getUserImage(provider.imgUrl)}
                      className={styles.pendingProviderAvatar}
                      alt={`${provider.firstName} ${provider.lastName}`}
                    />
                  </span>
                  <div className={styles.pendingProviderInfo}>
                    <div className={styles.pendingProviderName}>
                      {`${provider.firstName ?? "Deleted"} ${provider.lastName ?? "User"}`}
                    </div>
                    <div className={styles.pendingProviderDate}>
                      Added at:{" "}
                      {provider.addedAt
                        ? new Date(provider.addedAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                            timeZoneName: "short",
                          })
                        : "-"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={`${styles.title} ${nunito.className}`}>
          Order process
        </div>
        <div className={styles.processCards}>
          {hasSpecialProcessStatus ? (
            <ProcessCard
              imgUrl={specialProcessImgUrl}
              process={statusTitle}
              date="-"
            />
          ) : isCanceledOrder ? (
            <>
              <ProcessCard
                imgUrl={getUserImage(parentUser?.imgUrl)}
                process="Order canceled"
                date={refundedAtText !== "-" ? refundedAtText : "-"}
              />
              {requiresCancelFeePayout && (
                <ProcessCard
                  imgUrl={getUserImage(sitterUser?.user?.imgUrl)}
                  process="Cancel fee paid to sitter"
                  date={cancelFeePaidAtText}
                />
              )}
            </>
          ) : (
            <>
              {!order?.provider_markedAsServiceInProgressAt && (
                <ProcessCard
                  imgUrl={""}
                  process="Service not started yet"
                  date={providerMarkedServiceInProgressAt}
                />
              )}
              {order?.provider_markedAsServiceInProgressAt && (
                <ProcessCard
                  imgUrl={getUserImage(sitterUser?.user?.imgUrl)}
                  process="Provider marked service in progress"
                  date={providerMarkedServiceInProgressAt}
                />
              )}
              {order?.provider_markedAsServiceEndedAt && (
                <ProcessCard
                  imgUrl={getUserImage(sitterUser?.user?.imgUrl)}
                  process="Provider marked service ended"
                  date={providerMarkedServiceEndedAt}
                />
              )}
            </>
          )}
        </div>

        <div className={styles.reviews}>
          <div className={`${styles.title} ${nunito.className}`}>Reviews</div>
          {(order?.reviews?.length ?? 0) > 0 &&
            order.reviews?.map((r) => (
              <Review
                key={r.id}
                rating={r.generalRating}
                reviewedByImg={r?.reviewerImgUrl}
                reviewedByName={`${r?.reviewerFirstName}\n${r?.reviewerSurname}`}
                reviewedImg={r?.revieweeImgUrl}
                reviewedName={`${r?.revieweeFirstName}\n${r?.revieweeSurname}`}
                date={r.createdAt}
                isSelected={selectedReviewId === r.id}
                onClick={() => setSelectedReviewId(r.id)}
              />
            ))}
          <div className={styles.noReviews}>
            {(order?.reviews?.length ?? 0) === 0 && "No reviews yet"}
          </div>
        </div>

        <div className={`${styles.title} ${nunito.className}`}>
          Price summary
        </div>
        <PriceSummary
          hourlyRate={order?.finalPricePerHour ?? 0}
          serviceFee={order?.platformFeePrice ?? 0}
          subtotal={order?.subtotalPrice ?? 0}
          totalorderCost={order?.totalPrice ?? 0}
          duration={order?.serviceDurationHours}
          uegentFee={order?.urgentFee ?? 0}
          totalProviderPrice={order?.totalProviderPrice ?? 0}
        />
        {hasAdditionalPayments && (
          <div className={styles.additionalPaymentsSection}>
            <div className={styles.additionalPaymentsHeader}>
              <div className={`${styles.title} ${nunito.className}`}>
                Additional payments
              </div>
              {hasPendingAdditionalPayout && (
                <Button
                  title={
                    isPayingAdditionalPayments
                      ? "Paying..."
                      : "Payout additional payments"
                  }
                  type="BLACK"
                  onClick={payoutAdditionalPayments}
                  isDisabled={isPayingAdditionalPayments}
                  isLoading={isPayingAdditionalPayments}
                />
              )}
            </div>
            {order?.additionalPaymentsSummary && (
              <div className={styles.additionalPaymentsSummary}>
                <div className={styles.additionalSummaryItem}>
                  <span className={styles.additionalSummaryLabel}>State</span>
                  <span className={styles.additionalSummaryValue}>
                    {order.additionalPaymentsSummary.payoutState ?? "NONE"}
                  </span>
                </div>
                <div className={styles.additionalSummaryItem}>
                  <span className={styles.additionalSummaryLabel}>Pending</span>
                  <span className={styles.additionalSummaryValue}>
                    {order.additionalPaymentsSummary.payoutPendingCount ?? 0}
                  </span>
                </div>
                <div className={styles.additionalSummaryItem}>
                  <span className={styles.additionalSummaryLabel}>Paid</span>
                  <span className={styles.additionalSummaryValue}>
                    {order.additionalPaymentsSummary.payoutPaidCount ?? 0}
                  </span>
                </div>
                <div className={styles.additionalSummaryItem}>
                  <span className={styles.additionalSummaryLabel}>Balance</span>
                  <span className={styles.additionalSummaryValue}>
                    {formatCents(
                      order.additionalPaymentsSummary.payoutBalanceCents,
                    )}
                  </span>
                </div>
              </div>
            )}
            <div className={styles.additionalPaymentsList}>
              {additionalPayments.map((payment, index) => {
                const paymentKey = payment.id ?? payment._id ?? `payment-${index}`;
                const paymentAmount =
                  typeof payment.amountCents === "number"
                    ? formatCents(payment.amountCents)
                    : typeof payment.totalAmountCents === "number"
                      ? formatCents(payment.totalAmountCents)
                      : typeof payment.amount === "number"
                        ? formatCurrencyAmount(payment.amount, payment.currency)
                        : formatMoney(payment.totalAmount);
                const paymentPurpose =
                  payment.note ||
                  payment.description ||
                  payment.reason ||
                  "Additional payment";
                const paymentCompletedAt =
                  payment.payment_completed_at ?? payment.paidAt;
                const paymentInvoiceId =
                  payment.invoiceId ?? payment.additionalPaymentInvoiceId ?? null;
                const paymentInvoices = Array.isArray(payment.invoices)
                  ? payment.invoices
                  : [];
                const hasPaymentInvoice =
                  paymentInvoices.length > 0 ||
                  !!paymentInvoiceId ||
                  !!payment.invoiceNo ||
                  !!payment.invoiceDate;
                return (
                  <div key={paymentKey} className={styles.additionalPaymentCard}>
                    <div className={styles.additionalPaymentTop}>
                      <div>
                        <div className={styles.additionalPaymentTitle}>
                          {paymentPurpose}
                        </div>
                        <div className={styles.additionalPaymentMeta}>
                          Paid: {formatCompactDateTime(paymentCompletedAt)}
                        </div>
                      </div>
                      <div className={styles.additionalPaymentActions}>
                        <span
                          className={`${styles.additionalPaymentBadge} ${
                            String(payment.payoutState ?? "").toUpperCase() ===
                            "PAID"
                              ? styles.additionalPaymentBadgePaid
                              : String(payment.payoutState ?? "").toUpperCase() ===
                                  "PENDING"
                                ? styles.additionalPaymentBadgePending
                                : styles.additionalPaymentBadgeMuted
                          }`}
                        >
                          {payment.payoutState ?? "NOT_PAYABLE"}
                        </span>
                        {hasPaymentInvoice && (
                          <>
                            {paymentInvoices.map((invoice, invoiceIndex) => {
                              const invoiceId = invoice.id ?? invoice._id ?? null;
                              if (!invoiceId) return null;

                              return (
                                <Button
                                  key={`${invoiceId}-${invoiceIndex}`}
                                  title={getAdditionalPaymentInvoiceTitle(invoice)}
                                  type="OUTLINED"
                                  height={24}
                                  className={styles.additionalPaymentInvoiceButton}
                                  onClick={() =>
                                    openAdditionalPaymentInvoice(invoiceId)
                                  }
                                  isLoading={
                                    openingAdditionalPaymentInvoiceId === invoiceId
                                  }
                                  isDisabled={
                                    !!openingAdditionalPaymentInvoiceId &&
                                    openingAdditionalPaymentInvoiceId !== invoiceId
                                  }
                                />
                              );
                            })}
                            {paymentInvoices.length === 0 && (
                              <Button
                                title={
                                  paymentInvoiceId
                                    ? "Open invoice"
                                    : "Open invoices"
                                }
                                type="OUTLINED"
                                height={24}
                                className={styles.additionalPaymentInvoiceButton}
                                onClick={() => {
                                  if (paymentInvoiceId) {
                                    openAdditionalPaymentInvoice(paymentInvoiceId);
                                    return;
                                  }
                                  openOrderInvoicesPage();
                                }}
                                isLoading={
                                  !!paymentInvoiceId &&
                                  openingAdditionalPaymentInvoiceId ===
                                    paymentInvoiceId
                                }
                                isDisabled={
                                  !!openingAdditionalPaymentInvoiceId &&
                                  openingAdditionalPaymentInvoiceId !==
                                    paymentInvoiceId
                                }
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className={styles.additionalPaymentGrid}>
                      <div>
                        <span>Payment amount</span>
                        <b>{paymentAmount}</b>
                      </div>
                      <div>
                        <span>Provider amount</span>
                        <b>{formatCents(payment.providerAmountCents)}</b>
                      </div>
                      <div>
                        <span>Platform fee</span>
                        <b>{formatCents(payment.platformFeeCents)}</b>
                      </div>
                      <div>
                        <span>Stripe fee</span>
                        <b>
                          {typeof payment.stripeFeeCents === "number"
                            ? formatCents(payment.stripeFeeCents)
                            : formatMoney(payment.stripeFee)}
                        </b>
                      </div>
                      <div>
                        <span>Stripe net</span>
                        <b>
                          {typeof payment.stripeNetCents === "number"
                            ? formatCents(payment.stripeNetCents)
                            : formatMoney(payment.stripeNet)}
                        </b>
                      </div>
                      {payment.payoutId && (
                        <div>
                          <span>Payout ID</span>
                          <b>{payment.payoutId}</b>
                        </div>
                      )}
                      {payment.paidOutAt && (
                        <div>
                          <span>Paid out at</span>
                          <b>{formatCompactDateTime(payment.paidOutAt)}</b>
                        </div>
                      )}
                      {payment.invoiceNo && (
                        <div>
                          <span>Invoice No</span>
                          <b>{payment.invoiceNo}</b>
                        </div>
                      )}
                      {payment.invoiceDate && (
                        <div>
                          <span>Invoice date</span>
                          <b>{formatCompactDateTime(payment.invoiceDate)}</b>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {order?.isProviderIgnoredEndNotification && (
          <div className={styles.problemSection}>
            <div className={`${styles.title} ${nunito.className}`}>
              Order problems
            </div>
            <div
              className={`${styles.problemCard} ${
                problemStatus === "PROVIDER_MARKED_AS_SERVICE_ENDED"
                  ? styles.problemCardResolved
                  : ""
              }`}
            >
              <div className={styles.problemText}>
                <div
                  className={`${styles.problemTitle} ${
                    problemStatus === "PROVIDER_MARKED_AS_SERVICE_ENDED"
                      ? styles.problemTitleResolved
                      : ""
                  }`}
                >
                  Not ended
                </div>
                <div className={styles.problemSubtitle}>{problemNote}</div>
              </div>
              <button
                type="button"
                className={styles.problemSwitch}
                onClick={() => setIsProblemMenuOpen(true)}
                disabled={problemStatus === "PROVIDER_MARKED_AS_SERVICE_ENDED"}
              >
                <span className={styles.problemSwitchLabel}>
                  {problemStatus === "PROVIDER_MARKED_AS_SERVICE_ENDED"
                    ? "Solved"
                    : "Not solved"}
                </span>
                <span
                  className={`${styles.problemSwitchUi} ${
                    problemStatus === "PROVIDER_MARKED_AS_SERVICE_ENDED"
                      ? styles.problemSwitchUiSolved
                      : ""
                  }`}
                />
              </button>
              {isProblemMenuOpen && (
                <div className={styles.problemMenu}>
                  <button
                    type="button"
                    className={styles.problemMenuItem}
                    onClick={() => {
                      const note = "Client was contacted";
                      setProblemNote(note);
                      setProblemStatus("PROVIDER_MARKED_AS_SERVICE_ENDED");
                      finishOrder(note);
                    }}
                    disabled={isFinishingOrder}
                  >
                    <img src={callImg.src} alt="Call" />
                    Client was contacted
                  </button>
                  <button
                    type="button"
                    className={styles.problemMenuItem}
                    onClick={() => {
                      const note = "Provider was contacted";
                      setProblemNote(note);
                      setProblemStatus("PROVIDER_MARKED_AS_SERVICE_ENDED");
                      finishOrder(note);
                    }}
                    disabled={isFinishingOrder}
                  >
                    <img src={callImg.src} alt="Call" />
                    Provider was contacted
                  </button>
                  <button
                    type="button"
                    className={styles.problemMenuItem}
                    onClick={cancelOrder}
                    disabled={isCancelingOrder}
                  >
                    <img src={crossRedImg.src} alt="Cancel" />
                    Cancel by admin
                  </button>
                  <button
                    type="button"
                    className={`${styles.problemMenuItem} ${styles.problemMenuCancel}`}
                    onClick={() => setIsProblemMenuOpen(false)}
                    disabled={isFinishingOrder || isCancelingOrder}
                  >
                    <img src={closeImg.src} alt="Close" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className={`${styles.finalPrice} ${nunito.className}`}>
        <div>
          {showCanceledFeeBreakdown ? (
            <>
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>{finalPrimaryTitle}</span>
                <span className={styles.breakdownAmount}>{finalPrimaryValue}</span>
              </div>
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>Cancel fee to sitter</span>
                <span className={styles.breakdownAmount}>
                  {`€${cancelFeeDisplayAmount.toFixed(2)}`}
                </span>
              </div>
            </>
          ) : (
            <>
              <span className={styles.finalPriceTitle}>{finalPrimaryTitle}</span>
              <span className={styles.finalPriceValue}>{finalPrimaryValue}</span>
            </>
          )}
        </div>
        {!isCanceledOrder && order?.isReleasedFundsToProvider && (
          <span className={`${styles.paidText} ${nunito.className}`}>
            {`Sitter was paid at ${releasedFundsAt}`}
          </span>
        )}
        {!isCanceledOrder && isOrderPaid && !order?.isReleasedFundsToProvider && (
          <Button
            title={isReleasingFunds ? "Paying..." : "Pay the sitter"}
            type="BLACK"
            isDisabled={
              !order?.provider_markedAsServiceEndedAt || isReleasingFunds
            }
            onClick={payOrderHandler}
          />
        )}
        {isRefundableCanceledOrder &&
          areCanceledFinancialActionsDone && (
          <div className={styles.finalActionsColumn}>
            {(requiresRefund || isCanceledLate12h) && (
              <span className={`${styles.paidText} ${nunito.className}`}>
                {`Parent refunded at ${refundedAtText}`}
              </span>
            )}
            {requiresCancelFeePayout && (
              <span className={`${styles.paidText} ${nunito.className}`}>
                {`Sitter cancel fee paid at ${cancelFeePaidAtText}`}
              </span>
            )}
          </div>
        )}
        {isRefundableCanceledOrder &&
          isOrderPaid &&
          !areCanceledFinancialActionsDone && (
          <div className={styles.finalActionsRow}>
            {(requiresRefund || isCanceledLate12h) && !isRefundDone && (
              <Button
                title={isRefunding ? "Refunding..." : "Refund the parent"}
                type="BLACK"
                isDisabled={isRefunding || isPayingCancelFee}
                onClick={refundParent}
              />
            )}
            {requiresCancelFeePayout && !isCancelFeeDone && (
              <Button
                title={isPayingCancelFee ? "Paying..." : "Pay the sitter"}
                type="OUTLINED"
                isDisabled={isRefunding || isPayingCancelFee}
                onClick={payoutCancelFee}
              />
            )}
          </div>
        )}
      </div>
      <div className={styles.closeOrderRow}>
        {!isCanceledByAdmin && (
          <Button
            title={isCancelingOrder ? "Canceling..." : "Cancel order"}
            type="DELETE"
            isDisabled={isCancelingOrder}
            onClick={cancelOrder}
          />
        )}
        <Button
          title={order?.isClosedByAdmin ? "Open order" : "Close order"}
          type={order?.isClosedByAdmin ? "OUTLINED" : "DELETE"}
          isDisabled={isTogglingClosedByAdmin}
          onClick={() => setIsCloseOrderModalOpen(true)}
        />
      </div>
      {isConfirmModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Release funds?</h2>
            <p className={styles.confirmationBody}>
              Are you sure you want to pay the sitter? This action cannot be
              undone.
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeConfirmModal}
              />
              <Button
                title={isReleasingFunds ? "Paying..." : "Confirm payment"}
                type="BLACK"
                onClick={confirmPayOrder}
                isDisabled={isReleasingFunds}
              />
            </div>
          </div>
        </div>
      )}
      {isReleaseFundsErrorModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Payment failed</h2>
            <p className={styles.confirmationBody}>{releaseFundsErrorMessage}</p>
            {releaseFundsErrorDetails && (
              <p className={styles.errorDetails}>
                Stripe reason: {releaseFundsErrorDetails}
              </p>
            )}
            <div className={styles.confirmationActions}>
              <Button
                title="Close"
                type="OUTLINED"
                onClick={() => setIsReleaseFundsErrorModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
      {isStatusSelectorOpen && (
        <div
          className={`${styles.confirmationBackdrop} ${styles.statusSelectorBackdrop}`}
        >
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Change status</h2>
            <p className={styles.confirmationBody}>
              Select a new order status.
            </p>
            <label className={styles.statusSelectorLabel}>
              Status
              <select
                className={styles.statusSelector}
                value={selectedOrderStatus}
                onChange={(event) => setSelectedOrderStatus(event.target.value)}
                disabled={isUpdatingOrderStatus}
              >
                {orderStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getOrderStatusTitle(status, order?.isDirectOrderToProvider)}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeStatusSelector}
                isDisabled={isUpdatingOrderStatus}
              />
              <Button
                title="Continue"
                type="BLACK"
                onClick={openStatusConfirmModal}
                isDisabled={
                  isUpdatingOrderStatus ||
                  selectedOrderStatus === normalizeOrderStatus(problemStatus)
                }
              />
            </div>
          </div>
        </div>
      )}
      {isStatusConfirmModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Confirm status change?</h2>
            <p className={styles.confirmationBody}>
              Change order status from {currentOrderStatusTitle} to{" "}
              {selectedOrderStatusTitle}?
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Back"
                type="OUTLINED"
                onClick={() => {
                  setIsStatusConfirmModalOpen(false);
                  setIsStatusSelectorOpen(true);
                }}
                isDisabled={isUpdatingOrderStatus}
              />
              <Button
                title={isUpdatingOrderStatus ? "Changing..." : "Confirm change"}
                type="BLACK"
                onClick={confirmOrderStatusChange}
                isDisabled={isUpdatingOrderStatus}
              />
            </div>
          </div>
        </div>
      )}
      {isCloseOrderModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>
              {order?.isClosedByAdmin ? "Open order?" : "Close order?"}
            </h2>
            <p className={styles.confirmationBody}>
              {order?.isClosedByAdmin
                ? "Are you sure you want to open this order again?"
                : "Are you sure you want to close this order?"}
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeOrderModal}
                isDisabled={isTogglingClosedByAdmin}
              />
              <Button
                title={
                  isTogglingClosedByAdmin
                    ? order?.isClosedByAdmin
                      ? "Opening..."
                      : "Closing..."
                    : order?.isClosedByAdmin
                      ? "Confirm open"
                      : "Confirm close"
                }
                type={order?.isClosedByAdmin ? "BLACK" : "DELETE"}
                onClick={toggleClosedByAdmin}
                isDisabled={isTogglingClosedByAdmin}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedOrder;
