import { useState } from "react";
import { DetailedOrderType } from "@/types/DetailedOrder";
import styles from "./detailedOrder.module.css";
import { nunito } from "@/helpers/fonts";
import defaultUserImg from "../../../assets/images/default-avatar.png";
import ProfileHeading from "./ProfileHeading/ProfileHeading";
import flashImg from "../../../assets/images/flash-gray.svg";
import { options } from "@/data/orderStatusOptions";
import InfoCard from "./InfoCard/InfoCard";
import locationPinImg from "../../../assets/images/location-gray.svg";
import arriveImg from "../../../assets/images/arrival-gray.svg";
import leaveImg from "../../../assets/images/leave-gray.svg";
import childrenImg from "../../../assets/images/kid-gray.svg";
import { useMediaQuery } from "react-responsive";
import PriceSummary from "./PriceSummary/PriceSummary";
import Button from "@/components/Button/Button";
import ProcessCard from "./ProcessCard/ProcessCard";
import {
  cancelOrderByAdmin,
  finishOrderByAdmin,
  getOrderInvoice,
  getOrderProviderInvoice,
  getOrderProviderReceipt,
  payoutCancelFeeByOrderId,
  refundOrderById,
  releaseFundsByOrderId,
} from "@/pages/api/fetch";
import documentImg from "../../../assets/images/doc.svg";
import Review from "@/components/Reviews/ReviewsList/Review/Review";
import callImg from "../../../assets/images/call.svg";
import closeImg from "../../../assets/images/close.svg";
import crossRedImg from "../../../assets/images/cross-red.svg";

type DetailedOrderProps = {
  order: DetailedOrderType;
};

const DetailedOrder = ({ order }: DetailedOrderProps) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isReleaseFundsErrorModalOpen, setIsReleaseFundsErrorModalOpen] =
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
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [isProviderInvoiceLoading, setIsProviderInvoiceLoading] =
    useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isPayingCancelFee, setIsPayingCancelFee] = useState(false);
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

  const getUserImage = (imgUrl: string) =>
    imgUrl && imgUrl.length > 0 ? imgUrl : defaultUserImg.src;

  const getUserName = (name: string, lastName: string) =>
    `${name ?? "Deleted"} ${lastName ?? "User"}`;

  const sitterUser = order?.approvedProvider;
  const parentUser = order?.clientUser;

  const parentLocation = `${order?.address?.street ?? "Unknown"} ${
    order?.address?.houseNumber ?? ""
  }, ${order?.address?.city ?? ""}`;

  const arrivalTime = order?.startsAt
    ? new Date(order.startsAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      })
    : "-";

  const leaveTime = order?.endsAt
    ? new Date(order.endsAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      })
    : "-";

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

  const closeConfirmModal = () => setIsConfirmModalOpen(false);

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
    const isProviderNotSelected = order.approvedProviderId === null;
    return isProviderNotSelected ? "Not selected yet" : fullName;
  };

  const hasProviderActivityNumber = Boolean(
    order?.approvedProvider?.activityNumber || order?.approvedProvider?.activityNo,
  );
  const orderStatusUpper = String(order?.status ?? "").toUpperCase();
  const isCanceledOrder = orderStatusUpper.includes("CANCELED");
  const isCanceledByClient =
    orderStatusUpper === "CANCELED_BY_CLIENT" ||
    orderStatusUpper === "CLIENT_CANCELED";
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
  const requiresRefund = isCanceledByClient && !isCanceledLate12h && !isCanceledLate2h;
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
  const isRefundDone = !!order?.refundedAt;
  const isCancelFeeDone = !!order?.isCancelFeePaidToProvider;
  const statusTitle =
    problemStatus === "ORDER_CREATED" && order?.isDirectOrderToProvider
      ? "ORDER_CREATED (DIRECT ORDER TO PROVIDER)"
      : options.find((o) => o.value === problemStatus)?.title ?? "-";
  const areCanceledFinancialActionsDone = !isCanceledByClient
    ? true
    : isCanceledLate2h
      ? isCancelFeeDone
      : isCanceledLate12h
        ? isRefundDone && isCancelFeeDone
        : isRefundDone;
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
    ? isCanceledByClient
      ? requiresRefund || isCanceledLate12h
        ? isRefundDone
          ? "Refunded to parent"
          : "Refund to parent"
        : "Cancel fee to sitter"
      : "Canceled order payments"
    : "Final price to pay the sitter";
  const finalPrimaryValue = isCanceledOrder
    ? isCanceledByClient
      ? requiresRefund || isCanceledLate12h
        ? refundDisplayAmount != null
          ? `€${refundDisplayAmount.toFixed(2)}`
          : "—"
        : cancelFeeDisplayAmount != null
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
          sitterPhoneNo={sitterUser?.user?.phoneNumber}
          parentPhoneNo={parentUser?.phoneNumber}
        />
        <div className={styles.orderInfo}>
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
          <InfoCard
            title="Sitter's arrival time"
            iconImgUrl={arriveImg.src}
            type={isMobile ? "SPAN1" : "SPAN2"}
            info={arrivalTime}
          />
          <InfoCard
            title="Sitter's leaving time"
            iconImgUrl={leaveImg.src}
            type={isMobile ? "SPAN1" : "SPAN2"}
            info={leaveTime}
          />
          <InfoCard
            title="Children"
            iconImgUrl={childrenImg.src}
            type={isMobile ? "SPAN2" : "SPAN2"}
            info={childrenNames}
          />
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
          {isCanceledOrder ? (
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
        {!isCanceledOrder && !order?.isReleasedFundsToProvider && (
          <Button
            title={isReleasingFunds ? "Paying..." : "Pay the sitter"}
            type="BLACK"
            isDisabled={
              !order?.provider_markedAsServiceEndedAt || isReleasingFunds
            }
            onClick={payOrderHandler}
          />
        )}
        {isCanceledByClient && areCanceledFinancialActionsDone && (
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
        {isCanceledByClient && !areCanceledFinancialActionsDone && (
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
    </div>
  );
};

export default DetailedOrder;
