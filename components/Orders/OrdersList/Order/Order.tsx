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
  startsAt: string;
  endsAt: string;
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
  startsAt,
  endsAt,
  isProviderIgnoredEndNotification,
  pendingProvidersCount,
  isRecentlyChanged = false,
}: OrderProps) => {
  const router = useRouter();
  const statusTitle = getOrderStatusTitle(status, isDirectOrderToProvider);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

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
          <div className={styles.startDate}>
            Starts: {formatDateTime(startsAt)}
          </div>
          <div className={styles.endDate}>Ends: {formatDateTime(endsAt)}</div>
        </div>
      </div>
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
