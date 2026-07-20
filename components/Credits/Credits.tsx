import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import ReactPaginate from "react-paginate";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Button from "@/components/Button/Button";
import SearchBar from "@/components/SearchBar/SearchBar";
import defaultUserImg from "@/assets/images/default-avatar.png";
import paginateStyles from "@/styles/paginate.module.css";
import styles from "./credits.module.css";
import {
  CreditTransactionPayload,
  CreditTransactionUserPayload,
  CreditTransactionsSummaryPayload,
  CreditsListResponsePayload,
  getCredits,
  getCurrentAdminRolesFromJwt,
  getUserCredits,
  grantAdminUserCredits,
} from "@/pages/api/fetch";

type CreditsProps = {
  userId?: string;
  title?: string;
  onBackClick?: () => void;
  creditBalanceCents?: number;
};

const PAGE_SIZE = 20;

const SORT_BY_OPTIONS = [
  { title: "Date", value: "date" },
  { title: "User ID", value: "userId" },
  { title: "Amount", value: "amount" },
] as const;

const SORT_ORDER_OPTIONS = [
  { title: "Descending", value: "desc" },
  { title: "Ascending", value: "asc" },
] as const;

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatMoneyFromCents = (value?: number | null) => {
  const amount = typeof value === "number" ? value / 100 : 0;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const parseEuroAmountToCents = (value: string) => {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
};

const getUserName = (user?: CreditTransactionUserPayload) => {
  const fullName = user?.fullName?.trim();
  if (fullName) return fullName;
  return (
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.id || "-"
  );
};

const getUserRoute = (user?: CreditTransactionUserPayload) => {
  const mode = String(user?.currentMode ?? user?.userType ?? "").toUpperCase();
  if (mode.includes("PROVIDER")) return `/provider/${user?.id ?? ""}`;
  if (mode.includes("CLIENT")) return `/client/${user?.id ?? ""}`;
  return "";
};

const isAdminAllowedToGrantCredits = () => {
  const roles = getCurrentAdminRolesFromJwt();
  return roles.includes("SUPER_ADMIN") || roles.includes("CREDIT_MANAGER");
};

const normalizeCreditsResponse = (
  data: unknown,
): CreditsListResponsePayload | null => {
  if (!data || typeof data !== "object") return null;
  const payload = data as Record<string, unknown>;
  const result = payload.result as Record<string, unknown> | undefined;
  const source = result ?? payload;
  const items = Array.isArray(source.items) ? source.items : [];
  return {
    items: items.filter(
      (item): item is CreditTransactionPayload =>
        Boolean(item) && typeof item === "object",
    ),
    total: Number(source.total ?? 0),
    startIndex: Number(source.startIndex ?? 0),
    pageSize: Number(source.pageSize ?? PAGE_SIZE),
    hasMore: Boolean(source.hasMore ?? false),
    user:
      source.user && typeof source.user === "object"
        ? (source.user as CreditTransactionUserPayload)
        : undefined,
    summary:
      source.summary && typeof source.summary === "object"
        ? ({
            userId:
              typeof (source.summary as Record<string, unknown>).userId ===
              "string"
                ? String((source.summary as Record<string, unknown>).userId)
                : undefined,
            totalCount: Number(
              (source.summary as Record<string, unknown>).totalCount ?? 0,
            ),
            positiveAmountCents: Number(
              (source.summary as Record<string, unknown>).positiveAmountCents ??
                0,
            ),
            negativeAmountCents: Number(
              (source.summary as Record<string, unknown>).negativeAmountCents ??
                0,
            ),
            netAmountCents: Number(
              (source.summary as Record<string, unknown>).netAmountCents ?? 0,
            ),
            grantCount: Number(
              (source.summary as Record<string, unknown>).grantCount ?? 0,
            ),
            redemptionCount: Number(
              (source.summary as Record<string, unknown>).redemptionCount ?? 0,
            ),
            refundCount: Number(
              (source.summary as Record<string, unknown>).refundCount ?? 0,
            ),
            adjustmentCount: Number(
              (source.summary as Record<string, unknown>).adjustmentCount ?? 0,
            ),
          } satisfies CreditTransactionsSummaryPayload)
        : undefined,
  };
};

const Credits = ({
  userId,
  title,
  onBackClick,
  creditBalanceCents,
}: CreditsProps) => {
  const router = useRouter();
  const isUserScoped = Boolean(userId);
  const canGrantCredits = isUserScoped && isAdminAllowedToGrantCredits();
  const [items, setItems] = useState<CreditTransactionPayload[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [itemOffset, setItemOffset] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creditsUser, setCreditsUser] =
    useState<CreditTransactionUserPayload | null>(null);
  const [creditsSummary, setCreditsSummary] =
    useState<CreditTransactionsSummaryPayload | null>(null);
  const [queryText, setQueryText] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selectedSortBy, setSelectedSortBy] =
    useState<(typeof SORT_BY_OPTIONS)[number]["value"]>("date");
  const [appliedSortBy, setAppliedSortBy] =
    useState<(typeof SORT_BY_OPTIONS)[number]["value"]>("date");
  const [selectedSortOrder, setSelectedSortOrder] =
    useState<(typeof SORT_ORDER_OPTIONS)[number]["value"]>("desc");
  const [appliedSortOrder, setAppliedSortOrder] =
    useState<(typeof SORT_ORDER_OPTIONS)[number]["value"]>("desc");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [confirmAmountInput, setConfirmAmountInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [grantingCredits, setGrantingCredits] = useState(false);

  const currentTitle = title ?? (isUserScoped ? "User Credits" : "Credits");

  const applyFilters = () => {
    setAppliedQuery(queryText);
    setAppliedSortBy(selectedSortBy);
    setAppliedSortOrder(selectedSortOrder);
    setItemOffset(0);
  };

  const fetchCreditsList = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response =
        isUserScoped && userId
          ? await getUserCredits(userId, {
              startIndex: itemOffset,
              pageSize,
              sortBy: "date",
              sortOrder: "desc",
            })
          : await getCredits({
              startIndex: itemOffset,
              pageSize,
              q: appliedQuery.trim() || undefined,
              sortBy: appliedSortBy,
              sortOrder: appliedSortOrder,
            });

      const normalized = normalizeCreditsResponse(response.data);
      const data = normalized ?? {
        items: [],
        total: 0,
        startIndex: 0,
        pageSize: PAGE_SIZE,
        hasMore: false,
      };

      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total ?? 0));
      setPageSize(Number(data.pageSize ?? PAGE_SIZE) || PAGE_SIZE);
      setPageCount(
        Math.max(
          1,
          Math.ceil(
            Number(data.total ?? 0) /
              (Number(data.pageSize ?? PAGE_SIZE) || PAGE_SIZE),
          ),
        ),
      );
      setCreditsUser(isUserScoped ? (data.user ?? null) : null);
      setCreditsSummary(data.summary ?? null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Only CREDIT_MANAGER or SUPER_ADMIN can access credits.");
        return;
      }
      console.log(err);
      setError("Failed to load credits.");
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setCreditsSummary(null);
    } finally {
      setLoading(false);
    }
  }, [
    appliedQuery,
    appliedSortBy,
    appliedSortOrder,
    isUserScoped,
    itemOffset,
    pageSize,
    router,
    userId,
  ]);

  useEffect(() => {
    fetchCreditsList();
  }, [fetchCreditsList]);

  useEffect(() => {
    if (isUserScoped) {
      setAppliedQuery("");
      setQueryText("");
    }
  }, [isUserScoped, userId]);

  const handlePageClick = (event: { selected: number }) => {
    setItemOffset(event.selected * pageSize);
  };

  const openAddCreditsModal = () => {
    setAmountInput("");
    setConfirmAmountInput("");
    setNoteInput("");
    setIsAddModalOpen(true);
  };

  const closeAddCreditsModal = () => {
    if (grantingCredits) return;
    setIsAddModalOpen(false);
  };

  const confirmAddCredits = async () => {
    if (!userId || grantingCredits) return;

    const amountCents = parseEuroAmountToCents(amountInput);
    const confirmAmountCents = parseEuroAmountToCents(confirmAmountInput);

    if (amountCents == null || amountCents <= 0) {
      toast.error("Enter a valid euro amount.");
      return;
    }

    if (confirmAmountCents !== amountCents) {
      toast.error("Confirmation amount must match.");
      return;
    }

    try {
      setGrantingCredits(true);
      await grantAdminUserCredits(userId, {
        amountCents,
        note: noteInput.trim() || undefined,
      });
      toast.success("Credits granted");
      setIsAddModalOpen(false);
      if (isUserScoped) {
        router.reload();
        return;
      }
      await fetchCreditsList();
    } catch (err) {
      console.log(err);
      const message = axios.isAxiosError(err)
        ? String(
            err.response?.data?.error ??
              err.message ??
              "Failed to grant credits",
          )
        : "Failed to grant credits";
      toast.error(message);
    } finally {
      setGrantingCredits(false);
    }
  };

  const currentPage =
    pageCount === 0 ? 0 : Math.floor(itemOffset / pageSize) + 1;
  const positiveAmountCents = creditsSummary?.positiveAmountCents ?? 0;
  const negativeAmountCents = creditsSummary?.negativeAmountCents ?? 0;
  const netAmountCents = creditsSummary?.netAmountCents ?? 0;
  const balanceAfterCents =
    creditBalanceCents ??
    creditsUser?.creditBalanceCents ??
    items[0]?.balanceAfterCents;

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h2 className={styles.title}>{currentTitle}</h2>
          <div
            className={styles.subtitle}
          >{`${total} credit transactions, page ${currentPage}/${pageCount}`}</div>
        </div>
        <div className={styles.headerActions}>
          {canGrantCredits && (
            <Button
              title="Add credits"
              type="BLACK"
              onClick={openAddCreditsModal}
            />
          )}
          {onBackClick && (
            <Button title="Back" type="OUTLINED" onClick={onBackClick} />
          )}
        </div>
      </div>

      {!isUserScoped && (
        <div className={styles.panel}>
          <div className={styles.topRow}>
            <SearchBar
              placeholder="Search credits"
              searchText={queryText}
              setSearchText={setQueryText}
              onButtonClick={applyFilters}
            />
            <div className={styles.sortRow}>
              <label className={styles.field}>
                <span>Sort by</span>
                <select
                  value={selectedSortBy}
                  onChange={(e) =>
                    setSelectedSortBy(
                      e.target
                        .value as (typeof SORT_BY_OPTIONS)[number]["value"],
                    )
                  }
                >
                  {SORT_BY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Order</span>
                <select
                  value={selectedSortOrder}
                  onChange={(e) =>
                    setSelectedSortOrder(
                      e.target
                        .value as (typeof SORT_ORDER_OPTIONS)[number]["value"],
                    )
                  }
                >
                  {SORT_ORDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      )}

      {loading && <div className={styles.emptyState}>Loading credits...</div>}
      {!loading && error && <div className={styles.emptyState}>{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className={styles.emptyState}>
          No credits found for selected filters
        </div>
      )}

      {!loading && !error && creditsSummary && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Net amount</span>
            <span className={styles.summaryValue}>
              {formatMoneyFromCents(netAmountCents)}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Positive amount</span>
            <span className={styles.summaryValue}>
              {formatMoneyFromCents(positiveAmountCents)}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Negative amount</span>
            <span className={styles.summaryValue}>
              {formatMoneyFromCents(negativeAmountCents)}
            </span>
          </div>
          {isUserScoped && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Balance after</span>
              <span className={styles.summaryValue}>
                {formatMoneyFromCents(balanceAfterCents)}
              </span>
            </div>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.columnUser}>User</div>
            <div className={styles.columnType}>Type</div>
            <div className={styles.columnValue}>Amount</div>
            <div className={styles.columnValue}>Balance after</div>
            <div className={styles.columnValue}>Created at</div>
            <div className={styles.columnValue}>Note</div>
            <div className={styles.columnValue}>Order / payment</div>
          </div>

          {items.map((item) => {
            const user = item.user;
            const userRoute = getUserRoute(user);
            const userName = getUserName(user);
            const userAvatarSrc =
              user?.imgUrl && user.imgUrl.trim().length > 0
                ? user.imgUrl
                : defaultUserImg.src;
            const userLinkContent = (
              <>
                <img
                  className={styles.userAvatar}
                  src={userAvatarSrc}
                  alt=""
                  aria-hidden="true"
                />
                <span className={styles.userName}>{userName}</span>
              </>
            );
            const userNameNode = userRoute ? (
              <Link
                href={userRoute}
                className={styles.userLink}
                aria-label={`Open ${userName} profile`}
              >
                {userLinkContent}
              </Link>
            ) : (
              <span className={styles.userLink}>{userLinkContent}</span>
            );

            return (
              <div key={item.id} className={styles.tableRow}>
                <div className={styles.columnUser}>{userNameNode}</div>
                <div className={styles.columnType}>
                  <span className={styles.typeBadge}>{item.type}</span>
                  {item.source && (
                    <span className={styles.sourceBadge}>{item.source}</span>
                  )}
                </div>
                <div className={styles.columnValue}>
                  {formatMoneyFromCents(item.amountCents)}
                </div>
                <div className={styles.columnValue}>
                  {formatMoneyFromCents(item.balanceAfterCents)}
                </div>
                <div className={styles.columnValue}>
                  {formatDateTime(item.createdAt)}
                </div>
                <div className={styles.columnValue}>{item.note ?? "-"}</div>
                <div className={styles.columnValue}>
                  {item.orderId ??
                    item.paymentId ??
                    item.stripePaymentIntentId ??
                    "-"}
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

      {isAddModalOpen && (
        <div className={styles.backdrop}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Add credits</h3>
            <div className={styles.filtersGrid}>
              <label className={styles.field}>
                <span>Amount in EUR</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="25.55"
                />
              </label>
              <label className={styles.field}>
                <span>Confirm amount in EUR</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  value={confirmAmountInput}
                  onChange={(e) => setConfirmAmountInput(e.target.value)}
                  placeholder="25.55"
                />
              </label>
            </div>
            <label className={styles.field}>
              <span>Note</span>
              <textarea
                className={styles.noteInput}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Manual goodwill credit"
              />
            </label>
            <div className={styles.modalActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeAddCreditsModal}
                isDisabled={grantingCredits}
              />
              <Button
                title="Grant credits"
                type="BLACK"
                onClick={confirmAddCredits}
                isDisabled={grantingCredits}
                isLoading={grantingCredits}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credits;
