import { useEffect, useState, type FormEvent } from "react";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { getOrderEventsList } from "@/pages/api/fetch";
import styles from "./orderEvents.module.css";

type EventUser = { firstName?: string; lastName?: string; imgUrl?: string };
type EventRow = { id: string; type: string; category?: string; orderId: string; orderPrettyId?: string; occurredAt?: string; actorType?: string; source?: string; data?: Record<string, unknown> | null; provider?: EventUser | null; client?: EventUser | null };
const pretty = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, (m) => m.toUpperCase());
const date = (value?: string) => value ? new Date(value).toLocaleString("en-GB", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }) : "-";
const axiosErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (response?.data?.error) return response.data.error;
  }
  return "Failed to load order events. The API endpoint may not be deployed yet.";
};

export default function OrderEventsPage() {
  const [items, setItems] = useState<EventRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState("time");
  const [orderPrettyId, setOrderPrettyId] = useState("");
  const [eventName, setEventName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 50;
  const load = async () => { setLoading(true); setError(""); try { const response = await getOrderEventsList({ page, pageSize, sort, orderPrettyId: orderPrettyId || undefined, eventName: eventName || undefined, dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined, dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined }); setItems(response.data.items ?? []); setTotal(Number(response.data.total ?? 0)); } catch (err) { setError(axiosErrorMessage(err)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [page, sort]);
  const submit = (event: FormEvent) => { event.preventDefault(); if (page === 1) void load(); else setPage(1); };
  return <ModalPageTemplate isScrollable><main className={styles.main}><div className={styles.header}><div><h1>Order events</h1><span>{total} events</span></div><form onSubmit={submit} className={styles.filters}><input placeholder="Order pretty ID" value={orderPrettyId} onChange={(e) => setOrderPrettyId(e.target.value)} /><input placeholder="Event name" value={eventName} onChange={(e) => setEventName(e.target.value)} /><label>From <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label><label>To <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label><select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}><option value="time">Time</option><option value="event">Event</option><option value="order">Order</option></select><button type="submit">Search</button></form></div>{error && <p className={styles.error}>{error}</p>}<section className={styles.list}>{loading ? <p>Loading...</p> : items.length === 0 ? <p>No events found.</p> : items.map((item) => <article className={styles.row} key={item.id}><div className={styles.orderCell}><div className={styles.avatarGroup}><div className={styles.avatar}>{item.provider?.imgUrl ? <img src={item.provider.imgUrl} alt="" /> : "O"}</div><div className={styles.avatar}>{item.client?.imgUrl ? <img src={item.client.imgUrl} alt="" /> : "C"}</div></div><div><a href={`/orders/${item.orderId}`}>{item.orderPrettyId ?? item.orderId}</a><small>{item.provider ? `${item.provider.firstName ?? ""} ${item.provider.lastName ?? ""}` : "Provider not selected"}</small></div></div><strong>{pretty(item.type)}</strong><span className={styles.meta}>{item.actorType ?? "SYSTEM"} · {item.source ?? "API"}</span><time>{date(item.occurredAt)}</time></article>)}</section><div className={styles.pagination}><button disabled={page <= 1 || loading} onClick={() => setPage((v) => v - 1)}>Previous</button><span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span><button disabled={page >= Math.ceil(total / pageSize) || loading} onClick={() => setPage((v) => v + 1)}>Next</button></div></main></ModalPageTemplate>;
}
