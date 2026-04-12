import styles from "./ordersList.module.css";
import defaultUserImg from "../../../assets/images/default-avatar.png";
import { OrderType } from "@/types/Order";
import Order from "./Order/Order";

type OrdersListProps = {
  orders: OrderType[];
  recentlyChangedOrderIds?: Record<string, true>;
};

const OrdersList = ({ orders, recentlyChangedOrderIds = {} }: OrdersListProps) => {
  const getUserImage = (imgUrl?: string) =>
    imgUrl && imgUrl.length > 0 ? imgUrl : defaultUserImg.src;

  const getUserName = (firstName?: string, lastName?: string) =>
    `${firstName ?? "Deleted"} ${lastName ?? "User"}`;

  const getProviderName = (fullName: string, hasDisplayProvider: boolean) => {
    const isProviderNotSelected = !hasDisplayProvider;
    return isProviderNotSelected ? "Not selected yet(Provider)" : fullName;
  };

  return (
    <div className={styles.main}>
      {orders.map((u) => {
        const requiredDirectProvider =
          u.isDirectOrderToProvider &&
          !!u.requiredProvider &&
          !u.approvedProvider &&
          !u.approvedProviderId
            ? u.requiredProvider
            : null;
        const displayProvider = u.approvedProvider ?? requiredDirectProvider;
        const providerUser = displayProvider?.user;
        const clientUser = u.clientUser;

        return (
          <Order
            key={u.id}
            providerImgUrl={getUserImage(providerUser?.imgUrl)}
            clientImgUrl={getUserImage(clientUser?.imgUrl)}
            id={u.id}
            createdAt={u.createdAt}
            updatedAt={u.updatedAt}
            startsAt={u.startsAt}
            endsAt={u.endsAt}
            totalPrice={u.totalPrice}
            isUrgent={u.isUrgent}
            isDirectOrderToProvider={u.isDirectOrderToProvider}
            providerName={getProviderName(
              getUserName(providerUser?.firstName, providerUser?.lastName),
              !!displayProvider,
            )}
            clientName={`${getUserName(
              clientUser?.firstName,
              clientUser?.lastName,
            )} (Client)`}
            status={u.status}
            isProviderIgnoredEndNotification={
              u.isProviderIgnoredEndNotification
            }
            pendingProvidersCount={u.pendingProvidersCount}
            isRecentlyChanged={!!recentlyChangedOrderIds[u.id]}
          />
        );
      })}
    </div>
  );
};

export default OrdersList;
