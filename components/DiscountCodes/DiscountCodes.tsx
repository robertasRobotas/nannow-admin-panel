import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "react-toastify";
import ReactPaginate from "react-paginate";
import Button from "@/components/Button/Button";
import {
  createDiscountCode,
  expireDiscountCode,
  getDiscountCodes,
  revokeDiscountCode,
} from "@/pages/api/fetch";
import type { DiscountCode, DiscountUsageType } from "@/types/DiscountCode";
import styles from "./discountCodes.module.css";
import paginateStyles from "@/styles/paginate.module.css";

const PAGE_SIZE = 20;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB");
};

const isExpired = (code: DiscountCode) =>
  !!code.expiresAt && new Date(code.expiresAt).getTime() <= Date.now();

const effectiveStatus = (code: DiscountCode) => {
  if (code.status === "REVOKED") return "REVOKED";
  if (isExpired(code)) return "EXPIRED";
  return code.status; // ACTIVE | REDEEMED
};

const DiscountCodes = ({ title }: { title: string }) => {
  const router = useRouter();

  const [items, setItems] = useState<DiscountCode[]>([]);
  const [total, setTotal] = useState(0);
  const [itemOffset, setItemOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Create form
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("");
  const [usageType, setUsageType] =
    useState<DiscountUsageType>("ONCE_PER_USER");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getDiscountCodes({
        startIndex: itemOffset,
        pageSize: PAGE_SIZE,
      });
      setItems(response.data?.items ?? []);
      setTotal(response.data?.total ?? 0);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Only a SUPER_ADMIN can manage discount codes.");
        return;
      }
      setError("Failed to load discount codes.");
    } finally {
      setLoading(false);
    }
  }, [itemOffset, router]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = event.selected * PAGE_SIZE;
    setItemOffset(newOffset);
    setCurrentPage(event.selected + 1);
  };

  const resetForm = () => {
    setCode("");
    setPercentOff("");
    setUsageType("ONCE_PER_USER");
    setExpiresAt("");
  };

  const onCreate = async () => {
    if (creating) return;
    const trimmed = code.trim().toUpperCase();
    const percent = Number(percentOff);
    if (!trimmed) {
      toast.error("Enter a code.");
      return;
    }
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
      toast.error("Percentage must be an integer between 1 and 100.");
      return;
    }
    try {
      setCreating(true);
      await createDiscountCode({
        code: trimmed,
        percentOff: percent,
        usageType,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      toast.success(`Discount code ${trimmed} created.`);
      resetForm();
      setItemOffset(0);
      setCurrentPage(1);
      await fetchCodes();
    } catch (err) {
      const message =
        (axios.isAxiosError(err) &&
          (err.response?.data?.error || err.response?.data?.message)) ||
        "Failed to create discount code.";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const onRevoke = async (item: DiscountCode) => {
    if (actioningId) return;
    if (!confirm(`Revoke ${item.code}? It can no longer be used.`)) return;
    try {
      setActioningId(item.id);
      await revokeDiscountCode(item.id);
      toast.success(`${item.code} revoked.`);
      await fetchCodes();
    } catch {
      toast.error("Failed to revoke code.");
    } finally {
      setActioningId(null);
    }
  };

  const onExpire = async (item: DiscountCode) => {
    if (actioningId) return;
    if (!confirm(`Expire ${item.code} now?`)) return;
    try {
      setActioningId(item.id);
      await expireDiscountCode(item.id);
      toast.success(`${item.code} expired.`);
      await fetchCodes();
    } catch {
      toast.error("Failed to expire code.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h1 className={styles.title}>{title}</h1>
          <span className={styles.subtitle}>{total} codes</span>
        </div>
      </div>

      {/* Create form */}
      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>Create a discount code</h3>
        <div className={styles.filtersGrid}>
          <label className={styles.field}>
            <span>Code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              maxLength={40}
            />
          </label>
          <label className={styles.field}>
            <span>Percentage off</span>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              inputMode="numeric"
              value={percentOff}
              onChange={(e) => setPercentOff(e.target.value)}
              placeholder="20"
            />
          </label>
          <label className={styles.field}>
            <span>Usage type</span>
            <select
              value={usageType}
              onChange={(e) =>
                setUsageType(e.target.value as DiscountUsageType)
              }
            >
              <option value="ONCE_PER_USER">Once per user</option>
              <option value="ONE_TIME">One time (global)</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Expires at (optional)</span>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
        </div>
        <div className={styles.formActions}>
          <Button
            title="Create code"
            type="BLACK"
            onClick={onCreate}
            isDisabled={creating}
            isLoading={creating}
          />
        </div>
      </div>

      {loading && <div className={styles.stateText}>Loading…</div>}
      {!loading && error && <div className={styles.errorText}>{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className={styles.stateText}>No discount codes yet.</div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.colCode}>Code</div>
            <div className={styles.col}>Off</div>
            <div className={styles.col}>Type</div>
            <div className={styles.col}>Status</div>
            <div className={styles.col}>Expires</div>
            <div className={styles.col}>Used</div>
            <div className={styles.col}>Created</div>
            <div className={styles.colActions}>Actions</div>
          </div>

          {items.map((item) => {
            const status = effectiveStatus(item);
            const canAct = status !== "REVOKED";
            return (
              <div key={item.id} className={styles.tableRow}>
                <div className={styles.colCode}>{item.code}</div>
                <div className={styles.col}>{item.percentOff}%</div>
                <div className={styles.col}>
                  {item.usageType === "ONE_TIME" ? "One time" : "Per user"}
                </div>
                <div className={styles.col}>
                  <span
                    className={`${styles.badge} ${styles[`badge_${status}`] ?? ""}`}
                  >
                    {status}
                  </span>
                </div>
                <div className={styles.col}>{formatDate(item.expiresAt)}</div>
                <div className={styles.col}>{item.usedCount ?? 0}</div>
                <div className={styles.col}>{formatDate(item.createdAt)}</div>
                <div className={styles.colActions}>
                  <Button
                    title="Expire"
                    type="OUTLINED"
                    onClick={() => onExpire(item)}
                    isDisabled={!canAct || actioningId === item.id}
                  />
                  <Button
                    title="Revoke"
                    type="DELETE"
                    onClick={() => onRevoke(item)}
                    isDisabled={!canAct || actioningId === item.id}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pageCount > 1 && (
        <ReactPaginate
          breakLabel="..."
          nextLabel=">"
          onPageChange={handlePageClick}
          pageRangeDisplayed={2}
          marginPagesDisplayed={1}
          pageCount={pageCount}
          previousLabel="<"
          renderOnZeroPageCount={null}
          containerClassName={paginateStyles.pagination}
          pageLinkClassName={paginateStyles.pageLink}
          previousLinkClassName={paginateStyles.pageLink}
          nextLinkClassName={paginateStyles.pageLink}
          breakLinkClassName={paginateStyles.pageLink}
          activeLinkClassName={paginateStyles.activePageLink}
          forcePage={Math.max(0, currentPage - 1)}
        />
      )}
    </div>
  );
};

export default DiscountCodes;
