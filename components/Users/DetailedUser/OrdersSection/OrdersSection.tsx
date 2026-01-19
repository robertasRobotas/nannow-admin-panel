import styles from "./ordersSection.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UserDetails } from "@/types/Client";
import { getOrders } from "@/pages/api/fetch";
import axios from "axios";
import { useRouter } from "next/router";
import { OrderType } from "@/types/Order";
import Order from "@/components/Orders/OrdersList/Order/Order";
import defaultUserImg from "@/assets/images/default-avatar.png";
import { options as statusOptions } from "@/data/orderStatusOptions";

type OrdersSectionProps = {
  user: UserDetails;
  onBackClick: () => void;
};

const MAX_SCAN = 1000; // safety cap to avoid loading too much

const OrdersSection = ({ user, onBackClick }: OrdersSectionProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderType[]>([]);

  const providerId = user?.provider?.id;
  const providerUserId = user?.user?.id;

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load "All" to minimize status-by-status roundtrips
      // We'll paginate until we exhaust or reach MAX_SCAN
      const collected: OrderType[] = [];
      let startIndex = 0;
      let total = Infinity;
      let pageSize = 50;
      while (collected.length < Math.min(total, MAX_SCAN)) {
        const resp = await getOrders("", startIndex);
        const result = resp.data.result;
        const items: OrderType[] = result.items ?? [];
        pageSize = result.pageSize ?? items.length ?? 50;
        total = result.total ?? total;
        collected.push(...items);
        if (items.length === 0) break;
        startIndex += pageSize;
      }
      setOrders(collected);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
        if (err.status === 401) {
          router.push("/");
        }
      } else {
        setError("Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesApprovedProviderId =
        (o.approvedProviderId ?? null) && providerId
          ? o.approvedProviderId === providerId
          : false;
      const matchesApprovedProviderUserId =
        o.approvedProvider?.user?.id && providerUserId
          ? o.approvedProvider.user.id === providerUserId
          : false;
      const matchesRequiredProviderId =
        (o.requiredProviderId ?? null) && providerId
          ? o.requiredProviderId === providerId
          : false;
      return (
        matchesApprovedProviderId ||
        matchesApprovedProviderUserId ||
        matchesRequiredProviderId
      );
    });
  }, [orders, providerId, providerUserId]);

  const grouped = useMemo(() => {
    const map = new Map<string, OrderType[]>();
    for (const o of filteredOrders) {
      const key = o.status ?? "UNKNOWN_STATUS";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    // Order keys by statusOptions order first, then any unknown statuses
    const knownOrder = statusOptions.map((s) => s.value);
    const knownGroups = knownOrder
      .filter((k) => k.length > 0 && map.has(k))
      .map((k) => [k, map.get(k)!] as const);
    const unknownGroups = Array.from(map.entries()).filter(
      ([k]) => !knownOrder.includes(k)
    );
    return [...knownGroups, ...unknownGroups];
  }, [filteredOrders]);

  const getUserImage = (imgUrl?: string) =>
    imgUrl && imgUrl.length > 0 ? imgUrl : defaultUserImg.src;
  const getUserName = (firstName?: string, lastName?: string) =>
    `${firstName ?? "Deleted"} ${lastName ?? "User"}`;
  const getProviderName = (fullName: string, status: string) => {
    const isProviderNotSelected = [
      "ORDER_CREATED",
      "PROVIDER_SENT_OFFER_TO_CLIENT",
    ].includes(status);
    return isProviderNotSelected ? "Not selected yet(Provider)" : fullName;
  };

  const statusTitle = (status: string) =>
    statusOptions.find((o) => o.value === status)?.title ?? status;

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>Orders</h3>

      {loading && <div className={styles.empty}>Loading...</div>}
      {error && <div className={styles.empty}>{error}</div>}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className={styles.empty}>No orders for this user</div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className={styles.groups}>
          {grouped.map(([status, items]) => (
            <div key={status} className={styles.group}>
              <div className={styles.groupHeader}>
                <span className={`${styles.groupTitle} ${nunito.className}`}>
                  {statusTitle(status)}
                </span>
                <span className={styles.groupBadge}>{items.length}</span>
              </div>
              <div className={styles.groupContent}>
                {items.map((u) => {
                  const providerUser = u.approvedProvider?.user;
                  const clientUser = u.clientUser;
                  return (
                    <Order
                      key={u.id}
                      providerImgUrl={getUserImage(providerUser?.imgUrl)}
                      clientImgUrl={getUserImage(clientUser?.imgUrl)}
                      id={u.id}
                      startsAt={u.startsAt}
                      endsAt={u.endsAt}
                      providerName={getProviderName(
                        getUserName(
                          providerUser?.firstName,
                          providerUser?.lastName
                        ),
                        u.status
                      )}
                      clientName={`${getUserName(
                        clientUser?.firstName,
                        clientUser?.lastName
                      )} (Client)`}
                      status={u.status}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {isMobile && (
        <div className={styles.backBtnWrapper}>
          <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        </div>
      )}
    </div>
  );
};

export default OrdersSection;


