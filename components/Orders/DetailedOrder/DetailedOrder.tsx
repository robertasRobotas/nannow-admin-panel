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
import { finishOrderByAdmin, releaseFundsByOrderId } from "@/pages/api/fetch";
import documentImg from "../../../assets/images/doc.svg";
import Review from "@/components/Reviews/ReviewsList/Review/Review";
import callImg from "../../../assets/images/call.svg";
import closeImg from "../../../assets/images/close.svg";

type DetailedOrderProps = {
  order: DetailedOrderType;
};

const DetailedOrder = ({ order }: DetailedOrderProps) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isReleasingFunds, setIsReleasingFunds] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [problemNote, setProblemNote] = useState(
    order?.providerIgnoredEndNotificationResolvedReason ?? "No notes yet",
  );
  const [isProblemMenuOpen, setIsProblemMenuOpen] = useState(false);
  const [isFinishingOrder, setIsFinishingOrder] = useState(false);
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

  const getUserImage = (imgUrl: string) =>
    imgUrl && imgUrl.length > 0 ? imgUrl : defaultUserImg.src;

  const getUserName = (name: string, lastName: string) =>
    `${name ?? "Deleted"}\n${lastName ?? "User"}`;

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

  const payOrderHandler = () => {
    setIsConfirmModalOpen(true);
  };

  const confirmPayOrder = async () => {
    try {
      setIsReleasingFunds(true);
      const response = await releaseFundsByOrderId(order.id);
      if (response.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to release funds", error);
    } finally {
      setIsReleasingFunds(false);
      setIsConfirmModalOpen(false);
    }
  };

  const closeConfirmModal = () => setIsConfirmModalOpen(false);

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

  const getProviderName = (fullName: string, status: string) => {
    const isProviderNotSelected = [
      "ORDER_CREATED",
      "PROVIDER_SENT_OFFER_TO_CLIENT",
    ].includes(status);
    return isProviderNotSelected ? "Not selected yet" : fullName;
  };

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
            order.status,
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
                <div>
                  {options.find((o) => o.value === problemStatus)?.title ?? "-"}
                </div>
                {order?.isProviderIgnoredEndNotification && (
                  <div className={styles.statusAttention}>
                    Provider ignored end notification
                  </div>
                )}
              </>
            }
          />
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
        </div>
        <div className={`${styles.title} ${nunito.className}`}>
          Order process
        </div>
        <div className={styles.processCards}>
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
                    className={`${styles.problemMenuItem} ${styles.problemMenuCancel}`}
                    onClick={() => setIsProblemMenuOpen(false)}
                    disabled={isFinishingOrder}
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
          <span className={styles.finalPriceTitle}>
            Final price to pay the sitter
          </span>
          <span className={styles.finalPriceValue}>{`€${
            order?.totalProviderPrice?.toFixed(2) ?? "-"
          }`}</span>
        </div>
        {order?.isReleasedFundsToProvider ? (
          <span className={`${styles.paidText} ${nunito.className}`}>
            {`Sitter was paid at ${releasedFundsAt}`}
          </span>
        ) : (
          <Button
            title={isReleasingFunds ? "Paying..." : "Pay the sitter"}
            type="BLACK"
            isDisabled={
              !order?.provider_markedAsServiceEndedAt || isReleasingFunds
            }
            onClick={payOrderHandler}
          />
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
    </div>
  );
};

export default DetailedOrder;
