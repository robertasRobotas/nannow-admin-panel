/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ReactPaginate from "react-paginate";
import axios from "axios";
import styles from "./invoices.module.css";
import { nunito } from "@/helpers/fonts";
import paginateStyles from "@/styles/paginate.module.css";
import Button from "@/components/Button/Button";
import defaultAvatarImg from "@/assets/images/default-avatar.png";
import { getInvoices } from "@/pages/api/fetch";
import {
  GetInvoicesResponse,
  Invoice,
  InvoiceKind,
  InvoiceOwnerRole,
} from "@/types/Invoice";

const PAGE_SIZE = 20;

const ownerRoleOptions: Array<{ label: string; value: InvoiceOwnerRole | "" }> = [
  { label: "All roles", value: "" },
  { label: "Client", value: "CLIENT" },
  { label: "Provider", value: "PROVIDER" },
];

const kindOptions: Array<{ label: string; value: InvoiceKind | "" }> = [
  { label: "All kinds", value: "" },
  { label: "Platform fee invoice", value: "PLATFORM_FEE_INVOICE" },
  { label: "Provider invoice", value: "PROVIDER_INVOICE" },
  { label: "Provider receipt", value: "PROVIDER_RECEIPT" },
];

const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const formatMoney = (amount?: number, currency?: string) => {
  const value = typeof amount === "number" ? amount : 0;
  const code = currency || "EUR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${code}`;
  }
};

const Invoices = () => {
  const router = useRouter();
  const [items, setItems] = useState<Invoice[]>([]);
  const [itemOffset, setItemOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ownerRole, setOwnerRole] = useState<InvoiceOwnerRole | "">("");
  const [kind, setKind] = useState<InvoiceKind | "">("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [orderId, setOrderId] = useState("");

  const [appliedOwnerRole, setAppliedOwnerRole] = useState<InvoiceOwnerRole | "">(
    "",
  );
  const [appliedKind, setAppliedKind] = useState<InvoiceKind | "">("");
  const [appliedOwnerUserId, setAppliedOwnerUserId] = useState("");
  const [appliedOrderId, setAppliedOrderId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInvoices({
        startIndex: itemOffset,
        pageSize: PAGE_SIZE,
        ownerRole: appliedOwnerRole || undefined,
        kind: appliedKind || undefined,
        ownerUserId: appliedOwnerUserId.trim() || undefined,
        orderId: appliedOrderId.trim() || undefined,
      });

      const payload = response.data as
        | GetInvoicesResponse
        | { result?: GetInvoicesResponse };
      const data =
        (payload as { result?: GetInvoicesResponse }).result ??
        (payload as GetInvoicesResponse);
      const nextItems = Array.isArray(data?.items) ? data.items : [];
      const nextTotal = Number(data?.total ?? 0);
      const pageSize = Number(data?.pageSize ?? PAGE_SIZE);

      setItems(nextItems);
      setTotal(nextTotal);
      setPageCount(Math.ceil(nextTotal / (pageSize > 0 ? pageSize : PAGE_SIZE)));
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
        setError(err.message);
      } else {
        setError("Failed to load invoices");
      }
    } finally {
      setLoading(false);
    }
  }, [
    appliedKind,
    appliedOrderId,
    appliedOwnerRole,
    appliedOwnerUserId,
    itemOffset,
    router,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageClick = (event: { selected: number }) => {
    setItemOffset(event.selected * PAGE_SIZE);
  };

  const applyFilters = () => {
    setAppliedOwnerRole(ownerRole);
    setAppliedKind(kind);
    setAppliedOwnerUserId(ownerUserId);
    setAppliedOrderId(orderId);
    setItemOffset(0);
  };

  const shownTotal = useMemo(() => `${total} total`, [total]);

  return (
    <div className={styles.main}>
      <h2 className={`${styles.title} ${nunito.className}`}>Invoices</h2>

      <div className={styles.filters}>
        <select
          className={styles.select}
          value={ownerRole}
          onChange={(e) => setOwnerRole(e.target.value as InvoiceOwnerRole | "")}
        >
          {ownerRoleOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={kind}
          onChange={(e) => setKind(e.target.value as InvoiceKind | "")}
        >
          {kindOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          className={styles.input}
          placeholder="Owner user ID"
          value={ownerUserId}
          onChange={(e) => setOwnerUserId(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <Button title="Apply" type="OUTLINED" onClick={applyFilters} />
      </div>

      <div className={styles.total}>{shownTotal}</div>

      <div className={styles.list}>
        {loading && <div className={styles.empty}>Loading...</div>}
        {!loading && error && <div className={styles.empty}>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className={styles.empty}>No invoices found</div>
        )}

        {!loading &&
          !error &&
          items.map((invoice) => {
            const ownerName = `${invoice.owner?.firstName ?? ""} ${
              invoice.owner?.lastName ?? ""
            }`.trim();
            const ownerHref =
              invoice.ownerRole === "PROVIDER"
                ? `/provider/${invoice.ownerUserId}`
                : `/client/${invoice.ownerUserId}`;
            return (
              <div key={invoice.id} className={styles.row}>
                <div className={styles.left}>
                  <div className={styles.metaStrong}>
                    {formatDateTime(invoice.invoiceDate)}
                  </div>
                  <div className={styles.meta}>Invoice No: {invoice.invoiceNo}</div>
                  <div className={styles.meta}>Kind: {invoice.kind}</div>
                  <div className={styles.meta}>Owner role: {invoice.ownerRole}</div>
                  <div className={styles.meta}>Issued at: {formatDateTime(invoice.issuedAt)}</div>
                </div>

                <div className={styles.middle}>
                  <Link href={ownerHref} className={styles.ownerLink}>
                    <img
                      className={styles.ownerAvatar}
                      src={invoice.owner?.imgUrl || defaultAvatarImg.src}
                      alt={ownerName || "Owner"}
                    />
                    <div>
                      <div className={styles.ownerName}>{ownerName || "Unknown owner"}</div>
                      <div className={styles.ownerId}>{invoice.owner?.id || invoice.ownerUserId}</div>
                    </div>
                  </Link>
                  <div className={styles.meta}>Order ID: {invoice.orderId}</div>
                </div>

                <div className={styles.right}>
                  <div className={styles.amount}>
                    {formatMoney(invoice.amount, invoice.currency)}
                  </div>
                  <Button
                    title="Open order"
                    type="OUTLINED"
                    onClick={() => router.push(`/orders/${invoice.orderId}`)}
                  />
                </div>
              </div>
            );
          })}
      </div>

      <ReactPaginate
        breakLabel="..."
        nextLabel=""
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={pageCount}
        previousLabel=""
        renderOnZeroPageCount={null}
        forcePage={Math.floor(itemOffset / PAGE_SIZE)}
        containerClassName={paginateStyles.paginateWrapper}
        pageClassName={paginateStyles.pageBtn}
        pageLinkClassName={paginateStyles.pageLink}
        activeClassName={paginateStyles.activePage}
        nextClassName={paginateStyles.nextPageBtn}
        nextLinkClassName={paginateStyles.nextLink}
        previousClassName={paginateStyles.prevPageBtn}
        previousLinkClassName={paginateStyles.prevLink}
        breakClassName={paginateStyles.break}
      />
    </div>
  );
};

export default Invoices;
