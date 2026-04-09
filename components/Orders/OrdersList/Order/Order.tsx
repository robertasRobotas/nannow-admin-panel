import styles from "./order.module.css";
import { useRouter } from "next/router";
import { getOrderStatusTitle } from "@/data/orderStatusOptions";
import { OrderStatus } from "@/types/Order";

type OrderProps = {
  status: OrderStatus;
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
  isProviderIgnoredEndNotification?: boolean;
  pendingProvidersCount?: number;
  isRecentlyChanged?: boolean;
};

const Order = ({
  status,
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
  isProviderIgnoredEndNotification,
  pendingProvidersCount,
  isRecentlyChanged = false,
}: OrderProps) => {
  const router = useRouter();
  const statusTitle = getOrderStatusTitle(status, isDirectOrderToProvider);

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

  return (
    <div
      onClick={() => {
        router.push(`/orders/${id}`);
      }}
      className={`${styles.main} ${
        isRecentlyChanged ? styles.recentlyChanged : ""
      }`}
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
          </div>
          <div className={styles.updatedAt}>Updated: {updatedAtText}</div>
          <div className={styles.timeRange}>{timeRangeText}</div>
        </div>
      </div>
      {totalPriceText && <div className={styles.totalPrice}>{totalPriceText}</div>}
      <div className={styles.orderStatus}>
        {statusTitle}
        {isProviderIgnoredEndNotification && (
          <div className={styles.isProviderIgnoredEndNotification}>
            (Provider ignored end notification)
          </div>
        )}
      </div>
    </div>
  );
};

export default Order;
