import styles from "./ordersList.module.css";
import defaultUserImg from "../../../assets/images/default-avatar.png";
import { OrderType } from "@/types/Order";
import Order from "./Order/Order";

type OrdersListProps = {
  orders: OrderType[];
};

const OrdersList = ({ orders }: OrdersListProps) => {
  return (
    <div className={styles.main}>
      {orders.map((u) => (
        <Order
          key={u.id}
          providerImgUrl={
            u.approvedProvider?.user.imgUrl &&
            u.approvedProvider?.user.imgUrl.length > 0
              ? u.approvedProvider?.user.imgUrl
              : defaultUserImg.src
          }
          clientImgUrl={
            u.clientUser?.imgUrl && u.clientUser?.imgUrl.length > 0
              ? u.clientUser?.imgUrl
              : defaultUserImg.src
          }
          id={u.id}
          providerName={`${u.approvedProvider?.user?.firstName ?? "Deleted"} ${
            u.approvedProvider?.user?.lastName ?? "User"
          }`}
          clientName={`${u.clientUser?.firstName ?? "Deleted"} ${
            u.clientUser?.lastName ?? "User"
          }`}
          status={u.status}
        />
      ))}
    </div>
  );
};

export default OrdersList;
