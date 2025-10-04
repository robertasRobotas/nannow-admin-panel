import styles from "./ordersList.module.css";
import defaultUserImg from "../../../assets/images/default-avatar.png";
import { OrderType } from "@/types/Order";
import Order from "./Order/Order";

type OrdersListProps = {
  orders: OrderType[];
};

const OrdersList = ({ orders }: OrdersListProps) => {
  const getUserImage = (imgUrl?: string) =>
    imgUrl && imgUrl.length > 0 ? imgUrl : defaultUserImg.src;

  const getUserName = (firstName?: string, lastName?: string) =>
    `${firstName ?? "Deleted"} ${lastName ?? "User"}`;

  return (
    <div className={styles.main}>
      {orders.map((u) => {
        const providerUser = u.approvedProvider?.user;
        const clientUser = u.clientUser;

        return (
          <Order
            key={u.id}
            providerImgUrl={getUserImage(providerUser?.imgUrl)}
            clientImgUrl={getUserImage(clientUser?.imgUrl)}
            id={u.id}
            providerName={getUserName(
              providerUser?.firstName,
              providerUser?.lastName
            )}
            clientName={getUserName(
              clientUser?.firstName,
              clientUser?.lastName
            )}
            status={u.status}
          />
        );
      })}
    </div>
  );
};

export default OrdersList;
