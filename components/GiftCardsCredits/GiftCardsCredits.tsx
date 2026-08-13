import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import ReactPaginate from "react-paginate";
import {
  correctAdminGiftCardRecipient,
  getAdminGiftCards,
  getCredits,
  refundAdminGiftCard,
} from "@/pages/api/fetch";
import styles from "./giftCardsCredits.module.css";
import paginateStyles from "@/styles/paginate.module.css";

const PAGE_SIZE = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TabKey =
  | "ALL"
  | "NOT_REDEEMED"
  | "REDEEMED"
  | "EXPIRED"
  | "REFUNDED"
  | "MANUAL";

// Which data sets a tab needs: gift cards (with an optional status filter) and/or credits.
const TABS: {
  key: TabKey;
  label: string;
  showGift: boolean;
  giftFilter?: "REDEEMED" | "NOT_REDEEMED" | "EXPIRED" | "REFUNDED";
  showCredit: boolean;
}[] = [
  { key: "ALL", label: "All", showGift: true, showCredit: true },
  {
    key: "NOT_REDEEMED",
    label: "Not redeemed",
    showGift: true,
    giftFilter: "NOT_REDEEMED",
    showCredit: false,
  },
  {
    key: "REDEEMED",
    label: "Redeemed",
    showGift: true,
    giftFilter: "REDEEMED",
    showCredit: false,
  },
  {
    key: "EXPIRED",
    label: "Not redeemed & expired",
    showGift: true,
    giftFilter: "EXPIRED",
    showCredit: false,
  },
  {
    key: "REFUNDED",
    label: "Refunded",
    showGift: true,
    giftFilter: "REFUNDED",
    showCredit: false,
  },
  {
    key: "MANUAL",
    label: "Manually added credit",
    showGift: false,
    showCredit: true,
  },
];

type GiftCardRow = {
  id: string;
  code: string;
  status: string;
  amountCents: number;
  senderName?: string | null;
  recipientName?: string | null;
  recipientEmail?: string | null;
  expiresAt?: string | null;
  redeemedAt?: string | null;
  redeemedByUserId?: string | null;
  paymentStatus?: string | null;
  isRefundable?: boolean;
  hasBeenTransferred?: boolean;
  refundAction?: "RELEASE_AUTHORIZATION" | "REFUND_PAYMENT" | null;
  createdAt: string;
};

type CreditRow = {
  id: string;
  userId: string;
  amountCents: number;
  balanceAfterCents: number;
  note?: string | null;
  adminId?: string | null;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
};

const euro = (cents?: number | null) =>
  `€${(Math.max(0, cents ?? 0) / 100).toFixed(2)}`;
const date = (v?: string | null) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB");
};

const GiftCardsCredits = ({ title }: { title: string }) => {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("ALL");

  const [giftItems, setGiftItems] = useState<GiftCardRow[]>([]);
  const [giftTotal, setGiftTotal] = useState(0);
  const [giftOffset, setGiftOffset] = useState(0);

  const [creditItems, setCreditItems] = useState<CreditRow[]>([]);
  const [creditTotal, setCreditTotal] = useState(0);
  const [creditOffset, setCreditOffset] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [giftCardToCorrect, setGiftCardToCorrect] =
    useState<GiftCardRow | null>(null);
  const [correctedRecipientEmail, setCorrectedRecipientEmail] = useState("");
  const [isCorrectingRecipient, setIsCorrectingRecipient] = useState(false);
  const [giftCardToRefund, setGiftCardToRefund] =
    useState<GiftCardRow | null>(null);
  const [isRefundingGiftCard, setIsRefundingGiftCard] = useState(false);

  const activeTab = useMemo(() => TABS.find((t) => t.key === tab)!, [tab]);

  const handleAuthError = useCallback(
    (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return true;
      }
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Only a CREDIT_MANAGER or SUPER_ADMIN can view this.");
        return true;
      }
      return false;
    },
    [router],
  );

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const requests: Promise<void>[] = [];

      if (activeTab.showGift) {
        requests.push(
          getAdminGiftCards({
            filter: activeTab.giftFilter,
            startIndex: giftOffset,
            pageSize: PAGE_SIZE,
          }).then((res) => {
            setGiftItems(res.data?.items ?? []);
            setGiftTotal(res.data?.total ?? 0);
          }),
        );
      } else {
        setGiftItems([]);
        setGiftTotal(0);
      }

      if (activeTab.showCredit) {
        requests.push(
          getCredits({
            source: "ADMIN_GRANT",
            startIndex: creditOffset,
            pageSize: PAGE_SIZE,
          }).then((res) => {
            setCreditItems(res.data?.items ?? []);
            setCreditTotal(res.data?.total ?? 0);
          }),
        );
      } else {
        setCreditItems([]);
        setCreditTotal(0);
      }

      await Promise.all(requests);
    } catch (err) {
      if (!handleAuthError(err)) setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, giftOffset, creditOffset, handleAuthError]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const switchTab = (next: TabKey) => {
    setTab(next);
    setGiftOffset(0);
    setCreditOffset(0);
  };

  const openRecipientCorrection = (giftCard: GiftCardRow) => {
    setGiftCardToCorrect(giftCard);
    setCorrectedRecipientEmail("");
    setError("");
  };

  const applyRecipientCorrection = async () => {
    if (!giftCardToCorrect || isCorrectingRecipient) return;
    const nextEmail = correctedRecipientEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(nextEmail)) {
      setError("Enter a valid corrected recipient email.");
      return;
    }
    if (
      nextEmail ===
      String(giftCardToCorrect.recipientEmail ?? "")
        .trim()
        .toLowerCase()
    ) {
      setError("The recipient email is unchanged.");
      return;
    }

    try {
      setIsCorrectingRecipient(true);
      setError("");
      const response = await correctAdminGiftCardRecipient(
        giftCardToCorrect.id,
        nextEmail,
      );
      const giftCard = response.data?.giftCard as GiftCardRow | undefined;
      if (giftCard) {
        setGiftItems((items) =>
          items.map((item) => (item.id === giftCard.id ? giftCard : item)),
        );
      }
      setGiftCardToCorrect(null);
      setCorrectedRecipientEmail("");
      setNotice(
        response.data?.confirmationEmailsSent
          ? "Recipient corrected, code rotated, and confirmation emails sent."
          : "Recipient corrected and code rotated, but confirmation email delivery failed.",
      );
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(
          axios.isAxiosError(err)
            ? (err.response?.data?.error ?? "Failed to correct recipient.")
            : "Failed to correct recipient.",
        );
      }
    } finally {
      setIsCorrectingRecipient(false);
    }
  };

  const applyGiftCardRefund = async () => {
    if (!giftCardToRefund || isRefundingGiftCard) return;
    try {
      setIsRefundingGiftCard(true);
      setError("");
      const response = await refundAdminGiftCard(giftCardToRefund.id);
      setGiftCardToRefund(null);
      setNotice(
        response.data?.action === "AUTHORIZATION_RELEASED"
          ? "Payment hold canceled. The customer was not charged."
          : "Captured gift-card payment refunded.",
      );
      await fetchRows();
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(
          axios.isAxiosError(err)
            ? (err.response?.data?.error ?? "Failed to refund gift card.")
            : "Failed to refund gift card.",
        );
      }
    } finally {
      setIsRefundingGiftCard(false);
    }
  };

  const giftPageCount = Math.max(1, Math.ceil(giftTotal / PAGE_SIZE));
  const creditPageCount = Math.max(1, Math.ceil(creditTotal / PAGE_SIZE));
  const isEmpty =
    !loading &&
    !error &&
    (!activeTab.showGift || giftItems.length === 0) &&
    (!activeTab.showCredit || creditItems.length === 0);

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h1 className={styles.title}>{title}</h1>
          <span className={styles.subtitle}>
            {activeTab.showGift && `${giftTotal} gift cards`}
            {activeTab.showGift && activeTab.showCredit && " · "}
            {activeTab.showCredit && `${creditTotal} credit grants`}
          </span>
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => switchTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className={styles.stateText}>Loading…</div>}
      {!loading && error && <div className={styles.errorText}>{error}</div>}
      {!loading && notice && <div className={styles.noticeText}>{notice}</div>}
      {isEmpty && <div className={styles.stateText}>No records.</div>}

      {!loading && !error && activeTab.showGift && giftItems.length > 0 && (
        <div className={styles.section}>
          {activeTab.showCredit && (
            <h2 className={styles.sectionTitle}>Gift cards</h2>
          )}
          <div className={styles.table}>
            <div className={`${styles.giftHeader} ${styles.headerRowTable}`}>
              <div>Code</div>
              <div>Amount</div>
              <div>Status</div>
              <div>From</div>
              <div>Recipient</div>
              <div>Expires</div>
              <div>Created</div>
              <div>Action</div>
            </div>
            {giftItems.map((g) => {
              const expired =
                !!g.expiresAt && new Date(g.expiresAt).getTime() <= Date.now();
              const status =
                g.status === "REFUNDED"
                  ? "REFUNDED"
                  : g.paymentStatus === "AUTHORIZATION_CANCELED" ||
                      g.paymentStatus === "AUTHORIZATION_EXPIRED"
                    ? "CANCELED"
                  : g.status === "REDEEMED"
                  ? "REDEEMED"
                  : expired
                    ? "EXPIRED"
                    : "ACTIVE";
              return (
                <div key={g.id} className={styles.giftRow}>
                  <div className={styles.code}>{g.code}</div>
                  <div>{euro(g.amountCents)}</div>
                  <div>
                    <span
                      className={`${styles.badge} ${styles[`badge_${status}`] ?? ""}`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className={styles.muted}>{g.senderName || "-"}</div>
                  <div className={styles.muted}>
                    {[g.recipientName, g.recipientEmail]
                      .filter(Boolean)
                      .join(" · ") || "-"}
                  </div>
                  <div className={styles.muted}>{date(g.expiresAt)}</div>
                  <div className={styles.muted}>{date(g.createdAt)}</div>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.fixButton}
                      disabled={status !== "ACTIVE"}
                      onClick={() => openRecipientCorrection(g)}
                    >
                      Change recipient
                    </button>
                    {g.isRefundable && (
                      <button
                        type="button"
                        className={styles.refundButton}
                        onClick={() => {
                          setGiftCardToRefund(g);
                          setError("");
                        }}
                      >
                        {g.refundAction === "RELEASE_AUTHORIZATION"
                          ? "Cancel hold"
                          : "Refund"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {giftPageCount > 1 && (
            <ReactPaginate
              breakLabel="..."
              nextLabel=""
              onPageChange={(e) => setGiftOffset(e.selected * PAGE_SIZE)}
              pageRangeDisplayed={2}
              marginPagesDisplayed={1}
              pageCount={giftPageCount}
              previousLabel=""
              renderOnZeroPageCount={null}
              containerClassName={paginateStyles.paginateWrapper}
              pageClassName={paginateStyles.pageBtn}
              pageLinkClassName={paginateStyles.pageLink}
              activeClassName={paginateStyles.activePage}
              nextClassName={paginateStyles.nextPageBtn}
              nextLinkClassName={paginateStyles.nextLink}
              previousClassName={paginateStyles.prevPageBtn}
              previousLinkClassName={paginateStyles.prevLink}
              breakClassName={paginateStyles.break}
              forcePage={Math.floor(giftOffset / PAGE_SIZE)}
            />
          )}
        </div>
      )}

      {giftCardToCorrect && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3>Change gift-card recipient</h3>
            <p>
              Use this only when the recipient email was entered incorrectly.
              Enter the replacement email for {giftCardToCorrect.code}.
            </p>
            <label className={styles.modalField}>
              <span>Current recipient</span>
              <input value={giftCardToCorrect.recipientEmail ?? ""} disabled />
            </label>
            <label className={styles.modalField}>
              <span>Corrected recipient email</span>
              <input
                type="email"
                value={correctedRecipientEmail}
                placeholder="Enter the new recipient email"
                onChange={(event) =>
                  setCorrectedRecipientEmail(event.target.value)
                }
                autoFocus
                disabled={isCorrectingRecipient}
              />
            </label>
            <p className={styles.modalWarning}>
              Applying this fix rotates the code, updates assignment to a
              matching verified client, and emails the sender and corrected
              recipient.
            </p>
            {error && <div className={styles.modalError}>{error}</div>}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                disabled={isCorrectingRecipient}
                onClick={() => {
                  setGiftCardToCorrect(null);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.applyButton}
                disabled={isCorrectingRecipient}
                onClick={applyRecipientCorrection}
              >
                {isCorrectingRecipient ? "Applying..." : "Apply change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {giftCardToRefund && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3>
              {giftCardToRefund.refundAction === "RELEASE_AUTHORIZATION"
                ? "Cancel reserved payment?"
                : "Refund gift card?"}
            </h3>
            <p>
              Gift card <strong>{giftCardToRefund.code}</strong> for{" "}
              <strong>{euro(giftCardToRefund.amountCents)}</strong> will be
              permanently disabled.
            </p>
            <p className={styles.modalWarning}>
              {giftCardToRefund.refundAction === "RELEASE_AUTHORIZATION"
                ? "The payment is only reserved. This cancels the hold—no money will be captured and the customer will not be charged."
                : "The payment was captured. This will create a Stripe refund to the original payment method."}
            </p>
            {error && <div className={styles.modalError}>{error}</div>}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                disabled={isRefundingGiftCard}
                onClick={() => {
                  setGiftCardToRefund(null);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.applyButton}
                disabled={isRefundingGiftCard}
                onClick={applyGiftCardRefund}
              >
                {isRefundingGiftCard
                  ? "Processing..."
                  : giftCardToRefund.refundAction === "RELEASE_AUTHORIZATION"
                    ? "Cancel payment hold"
                    : "Refund payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && activeTab.showCredit && creditItems.length > 0 && (
        <div className={styles.section}>
          {activeTab.showGift && (
            <h2 className={styles.sectionTitle}>Manually added credits</h2>
          )}
          <div className={styles.table}>
            <div className={`${styles.creditHeader} ${styles.headerRowTable}`}>
              <div>User</div>
              <div>Amount</div>
              <div>Balance after</div>
              <div>Note</div>
              <div>Admin</div>
              <div>Created</div>
            </div>
            {creditItems.map((c) => {
              const userLabel =
                [c.user?.firstName, c.user?.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                c.user?.email ||
                c.userId;
              return (
                <div key={c.id} className={styles.creditRow}>
                  <div className={styles.muted}>{userLabel}</div>
                  <div className={styles.plus}>+{euro(c.amountCents)}</div>
                  <div>{euro(c.balanceAfterCents)}</div>
                  <div className={styles.muted}>{c.note || "-"}</div>
                  <div className={styles.muted}>{c.adminId || "-"}</div>
                  <div className={styles.muted}>{date(c.createdAt)}</div>
                </div>
              );
            })}
          </div>
          {creditPageCount > 1 && (
            <ReactPaginate
              breakLabel="..."
              nextLabel=""
              onPageChange={(e) => setCreditOffset(e.selected * PAGE_SIZE)}
              pageRangeDisplayed={2}
              marginPagesDisplayed={1}
              pageCount={creditPageCount}
              previousLabel=""
              renderOnZeroPageCount={null}
              containerClassName={paginateStyles.paginateWrapper}
              pageClassName={paginateStyles.pageBtn}
              pageLinkClassName={paginateStyles.pageLink}
              activeClassName={paginateStyles.activePage}
              nextClassName={paginateStyles.nextPageBtn}
              nextLinkClassName={paginateStyles.nextLink}
              previousClassName={paginateStyles.prevPageBtn}
              previousLinkClassName={paginateStyles.prevLink}
              breakClassName={paginateStyles.break}
              forcePage={Math.floor(creditOffset / PAGE_SIZE)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default GiftCardsCredits;
