import styles from "./order.module.css";
import { useRouter } from "next/router";
import { options } from "@/data/orderStatusOptions";
import { OrderStatus } from "@/types/Order";

type OrderProps = {
  status: OrderStatus;
  providerName: string;
  providerImgUrl: string;
  clientName: string;
  clientImgUrl: string;
  id: string;
};

const Order = ({
  status,
  providerName,
  providerImgUrl,
  clientName,
  clientImgUrl,
  id,
}: OrderProps) => {
  const router = useRouter();

  return (
    <div
      onClick={() => {
        router.push(`/orders/${id}`);
      }}
      className={styles.main}
    >
      <div className={styles.orderUsers}>
        <div className={styles.profilePics}>
          <img className={styles.providerImg} src={providerImgUrl} />
          <img className={styles.clientImg} src={clientImgUrl} />
        </div>
        <div className={styles.names}>
          <div className={styles.providerName}>{providerName}</div>
          <div className={styles.clientName}>{clientName}</div>
        </div>
      </div>
      <div className={styles.orderStatus}>
        {options.find((o) => o.value === status)?.title}
      </div>
    </div>
  );
};

export default Order;
