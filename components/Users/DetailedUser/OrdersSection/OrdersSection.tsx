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
import {
  getOrderStatusTitle,
  normalizeOrderStatus,
  options as statusOptions,
} from "@/data/orderStatusOptions";

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
  const expectedOrdersCount = user?.orders?.length ?? 0;

  const orderMatchesProvider = useCallback(
    (order: OrderType) => {
      const matchesApprovedProviderId =
        (order.approvedProviderId ?? null) && providerId
          ? order.approvedProviderId === providerId
          : false;
      const matchesApprovedProviderUserId =
        order.approvedProvider?.user?.id && providerUserId
          ? order.approvedProvider.user.id === providerUserId
          : false;
      const matchesRequiredProviderId =
        (order.requiredProviderId ?? null) && providerId
          ? order.requiredProviderId === providerId
          : false;
      return (
        matchesApprovedProviderId ||
        matchesApprovedProviderUserId ||
        matchesRequiredProviderId
      );
    },
    [providerId, providerUserId],
  );

  const fetchLegacyProviderOrders = useCallback(async () => {
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
    return collected.filter(orderMatchesProvider);
  }, [orderMatchesProvider]);

  const fetchProviderOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const collected: OrderType[] = [];
      let startIndex = 0;
      let total = Infinity;
      let pageSize = 50;
      while (collected.length < Math.min(total, MAX_SCAN)) {
        const resp = await getOrders("", startIndex, {
          approvedProviderId: providerId,
        });
        const result = resp.data.result;
        const items: OrderType[] = result.items ?? [];
        const filteredItems = items.filter(orderMatchesProvider);
        const filterLooksIgnored =
          items.some((item) => !orderMatchesProvider(item)) ||
          (expectedOrdersCount > 0 &&
            Number(result.total ?? 0) > expectedOrdersCount);

        if (filterLooksIgnored) {
          setOrders(await fetchLegacyProviderOrders());
          return;
        }

        pageSize = result.pageSize ?? items.length ?? 50;
        total = result.total ?? total;
        collected.push(...filteredItems);
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
  }, [
    expectedOrdersCount,
    fetchLegacyProviderOrders,
    orderMatchesProvider,
    providerId,
    router,
  ]);

  useEffect(() => {
    fetchProviderOrders();
  }, [fetchProviderOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(orderMatchesProvider);
  }, [orders, orderMatchesProvider]);

  const grouped = useMemo(() => {
    const map = new Map<string, OrderType[]>();
    for (const o of filteredOrders) {
      const key = normalizeOrderStatus(o.status) || "UNKNOWN_STATUS";
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
  const getProviderName = (fullName: string, hasDisplayProvider: boolean) => {
    return hasDisplayProvider ? fullName : "Not selected yet(Provider)";
  };

  const statusTitle = (status: string) => getOrderStatusTitle(status) || status;

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
                      isDirectOrderToProvider={u.isDirectOrderToProvider}
                      providerName={getProviderName(
                        getUserName(
                          providerUser?.firstName,
                          providerUser?.lastName
                        ),
                        !!displayProvider
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
