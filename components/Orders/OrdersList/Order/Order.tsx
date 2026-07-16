import styles from "./order.module.css";
import Link from "next/link";
import { getOrderStatusTitle } from "@/data/orderStatusOptions";
import { OrderStatus } from "@/types/Order";

type OrderProps = {
  status: OrderStatus;
  paymentStatus?: string | null;
  isDirectOrderToProvider?: boolean;
  providerName: string;
  providerImgUrl: string;
  clientName: string;
  clientImgUrl: string;
  id: string;
  createdAt: string;
  updatedAt?: string | null;
  startsAt: string;
  endsAt: string;
  totalPrice?: number | null;
  creditsAppliedCents?: number | null;
  discountCode?: string | null;
  discountAppliedCents?: number | null;
  isUrgent?: boolean;
  isProviderIgnoredEndNotification?: boolean;
  pendingProvidersCount?: number;
  isRecentlyChanged?: boolean;
};

const Order = ({
  status,
  paymentStatus,
  isDirectOrderToProvider = false,
  providerName,
  providerImgUrl,
  clientName,
  clientImgUrl,
  id,
  createdAt,
  updatedAt,
  startsAt,
  endsAt,
  totalPrice,
  creditsAppliedCents,
  discountCode,
  discountAppliedCents,
  isUrgent = false,
  isProviderIgnoredEndNotification,
  pendingProvidersCount,
  isRecentlyChanged = false,
}: OrderProps) => {
  const statusTitle = getOrderStatusTitle(status, isDirectOrderToProvider);
  // Money reserved on the card (manual capture) but not captured yet.
  const isPaymentReserved =
    String(paymentStatus ?? "").toUpperCase() === "AUTHORIZED";

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const updatedAtText = formatDateTime(updatedAt || createdAt);
  const timeRangeText = `${formatDateTime(startsAt)} - ${formatDateTime(endsAt)}`;
  const totalPriceText =
    typeof totalPrice === "number" ? `€${totalPrice.toFixed(2)}` : null;
  const reductionCents = Math.max(
    0,
    (creditsAppliedCents ?? 0) + (discountAppliedCents ?? 0),
  );
  const hasReduction = typeof totalPrice === "number" && reductionCents > 0;
  const chargedText = hasReduction
    ? `€${Math.max(0, (totalPrice as number) - reductionCents / 100).toFixed(2)}`
    : null;

  return (
    <Link
      href={`/orders/${id}`}
      className={`${styles.main} ${
        isPaymentReserved ? styles.reservedPayment : ""
      } ${isRecentlyChanged ? styles.recentlyChanged : ""}`}
    >
      <div className={styles.orderUsers}>
        <div className={styles.profilePics}>
          <img className={styles.providerImg} src={providerImgUrl} />
          <img className={styles.clientImg} src={clientImgUrl} />
        </div>
        <div className={styles.info}>
          <div className={styles.names}>
            <div className={styles.providerName}>{providerName}</div>
            <div className={styles.clientName}>{clientName}</div>
            {pendingProvidersCount !== undefined &&
              pendingProvidersCount > 0 && (
                <div className={styles.pendingCount}>
                  Pending Providers:{pendingProvidersCount}
                </div>
              )}
            {isUrgent && <div className={styles.urgentBadge}>Urgent</div>}
            {isPaymentReserved && (
              <div className={styles.reservedBadge}>Reserved</div>
            )}
          </div>
          <div className={styles.updatedAt}>Updated: {updatedAtText}</div>
          <div className={styles.timeRange}>{timeRangeText}</div>
        </div>
      </div>
      {totalPriceText && (
        <div className={styles.totalPrice}>
          {hasReduction ? (
            <>
              <span className={styles.originalPrice}>{totalPriceText}</span>
              <span>{chargedText}</span>
              {discountCode && (
                <span className={styles.discountTag}>{discountCode}</span>
              )}
              {(creditsAppliedCents ?? 0) > 0 && (
                <span className={styles.creditsTag}>Credits used</span>
              )}
            </>
          ) : (
            totalPriceText
          )}
        </div>
      )}
      <div className={styles.orderStatus}>
        {statusTitle}
        {isProviderIgnoredEndNotification && (
          <div className={styles.isProviderIgnoredEndNotification}>
            (Provider ignored end notification)
          </div>
        )}
      </div>
    </Link>
  );
};

export default Order;
