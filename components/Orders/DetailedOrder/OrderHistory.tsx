import { useCallback, useEffect, useState } from "react";
import { getOrderEvents } from "@/pages/api/fetch";
import styles from "./detailedOrder.module.css";
import { nunito } from "@/helpers/fonts";

type OrderEvent = {
  id: string;
  type: string;
  category?: string;
  occurredAt?: string;
  actorType?: string;
  actorId?: string | null;
  source?: string;
  data?: Record<string, unknown> | null;
};

const title = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, (m) => m.toUpperCase());
const formatDate = (value?: string) => value ? new Date(value).toLocaleString("en-GB", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }) : "-";
const detail = (event: OrderEvent) => {
  const data = event.data ?? {};
  if (event.type === "STATUS_CHANGED") return `${String(data.from ?? "-")} → ${String(data.to ?? "-")}`;
  if (event.type === "REMINDER_SENT" || event.type === "REMINDER_FAILED" || event.type === "REMINDER_ATTEMPTED") return `${String(data.reminderType ?? "Reminder")} · ${String(data.channel ?? "-")} · sequence ${String(data.sequence ?? "-")}`;
  if (event.type === "REVIEW_SUBMITTED") return `${String(data.reviewType ?? "Review")} · rating ${String(data.rating ?? "-")}`;
  if (event.type === "ADMIN_CHANGED") return Array.isArray(data.fields) ? `Fields: ${data.fields.join(", ")}` : String(data.action ?? "Order changed by admin");
  if (data.providerId) return `Provider: ${String(data.providerId)}`;
  return null;
};

export default function OrderHistory({ orderId }: { orderId: string }) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (before?: string | null) => {
    try {
      before ? setLoadingMore(true) : setLoading(true);
      setError(null);
      const response = await getOrderEvents(orderId, before);
      const result = response.data as { events?: OrderEvent[]; hasMore?: boolean; nextBefore?: string | null };
      setEvents((current) => before ? [...current, ...(result.events ?? [])] : (result.events ?? []));
      setHasMore(Boolean(result.hasMore));
      setNextBefore(result.nextBefore ?? null);
    } catch { setError("Failed to load order history."); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [orderId]);

  useEffect(() => { void load(); }, [load]);

  return <section className={`${styles.orderHistory} ${styles.orderHistoryStandalone}`}>
    <div className={`${styles.title} ${nunito.className}`}>Order history</div>
    {loading ? <div className={styles.historyMuted}>Loading history...</div> : error ? <div className={styles.historyError}>{error}</div> : events.length === 0 ? <div className={styles.historyMuted}>No history events recorded.</div> : <div className={styles.historyList}>
      {events.map((event) => <article className={styles.historyItem} key={event.id}>
        <div className={styles.historyItemHeader}><strong>{title(event.type)}</strong></div>
        <div className={styles.historyItemContent}>
          <div className={styles.historyMeta}>{event.actorType ?? "SYSTEM"}{event.source ? ` · ${event.source}` : ""}</div>
          {detail(event) && <div className={styles.historyDetail}>{detail(event)}</div>}
        </div>
        <time className={styles.historyTimestamp}>{formatDate(event.occurredAt)}</time>
      </article>)}
    </div>}
    {!loading && !error && hasMore && <button className={styles.historyLoadMore} type="button" onClick={() => void load(nextBefore)} disabled={loadingMore}>{loadingMore ? "Loading..." : "Load more"}</button>}
  </section>;
}
