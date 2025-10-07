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

type DetailedOrderProps = {
  order: DetailedOrderType;
};

const DetailedOrder = ({ order }: DetailedOrderProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

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
          }
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

  return (
    <div className={styles.main}>
      <div className={styles.orderWrapper}>
        <div className={`${styles.title} ${nunito.className}`}>
          Order details
        </div>
        <ProfileHeading
          sitterName={getUserName(
            sitterUser?.user?.firstName,
            sitterUser?.user?.lastName
          )}
          sitterImgUrl={getUserImage(sitterUser?.user?.imgUrl)}
          parentName={getUserName(parentUser?.firstName, parentUser?.lastName)}
          parentImgUrl={getUserImage(parentUser?.imgUrl)}
        />
        <div className={styles.orderInfo}>
          <InfoCard
            title="Status"
            iconImgUrl={flashImg.src}
            type={isMobile ? "SPAN1" : "SPAN3"}
            info={options.find((o) => o.value === order?.status)?.title ?? "-"}
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
          {order?.provider_markedAsServiceInProgressAt && (
            <ProcessCard
              imgUrl={getUserImage(sitterUser?.user?.imgUrl)}
              process="Parent marked service as in progress"
              date={providerMarkedServiceInProgressAt}
            />
          )}
          {order?.provider_markedAsServiceEndedAt && (
            <ProcessCard
              imgUrl={getUserImage(sitterUser?.user?.imgUrl)}
              process="Parent marked service as ended"
              date={providerMarkedServiceEndedAt}
            />
          )}
        </div>
        <div className={`${styles.title} ${nunito.className}`}>
          Price summary
        </div>
        <PriceSummary
          hourlyRate={order?.finalPricePerHour ?? 0}
          serviceFee={order?.platformFeePrice ?? 0}
          subtotal={order?.subtotalPrice ?? 0}
          total={order?.totalPrice ?? 0}
          duration={order?.serviceDurationHours}
        />
      </div>
      <div className={`${styles.finalPrice} ${nunito.className}`}>
        <div>
          <span className={styles.finalPriceTitle}>
            Final price to pay the sitter
          </span>
          <span className={styles.finalPriceValue}>{`€${
            order?.totalPrice ?? 0
          }`}</span>
        </div>
        <Button
          title="Pay the sitter"
          type="BLACK"
          isDisabled={!order?.provider_markedAsServiceEndedAt}
        />
      </div>
    </div>
  );
};

export default DetailedOrder;
