import styles from "./header.module.css";
import logoImg from "../../assets/images/logo-admin.svg";
import Link from "next/link";
import HeaderButton from "../HeaderButton/HeaderButton";
import Button from "../Button/Button";
import burgerBtn from "../../assets/images/burger-btn.svg";
import { links } from "@/data/headerLinks";
import { useEffect, useState } from "react";
import HeaderMenu from "./HeaderMenu/HeaderMenu";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  getCanceledPendingFinancialOrdersCount,
  getUnreadAdminMessagesCount,
  getCurrentAdminRolesFromJwt,
  getNotFinishedOnboardingUsers,
  getNotEndedOrdersCount,
  getNotResolvedFeedbackCount,
  getNotResolvedReportsCount,
  getNotReviewedDocumentsCount,
  getNotPaidOrdersCount,
  getPendingProviderSpecialSkillsCount,
  getPendingCriminalRecordCount,
  postAdminMessage,
  setupAdminTotp,
  verifyAdminTotpSetup,
} from "@/pages/api/fetch";
import axios from "axios";
import { disconnectAdminSocket } from "@/helpers/adminSocket";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";
import MessagesIcon from "@/components/Icons/MessagesIcon";

const Header = () => {
  const [isMenuDisplayed, setMenuDisplayed] = useState(false);
  const [notEndedOrdersCount, setNotEndedOrdersCount] = useState(0);
  const [notPaidOrdersCount, setNotPaidOrdersCount] = useState(0);
  const [canceledPendingFinancialCount, setCanceledPendingFinancialCount] =
    useState(0);
  const [notFinishedOnboardingCount, setNotFinishedOnboardingCount] =
    useState(0);
  const [pendingCriminalChecksCount, setPendingCriminalChecksCount] =
    useState(0);
  const [pendingProviderSpecialSkillsCount, setPendingProviderSpecialSkillsCount] =
    useState(0);
  const [notSolvedFeedbackCount, setNotSolvedFeedbackCount] = useState(0);
  const [notReviewedDocumentsCount, setNotReviewedDocumentsCount] = useState(0);
  const [notResolvedReportsCount, setNotResolvedReportsCount] = useState(0);
  const [unreadAdminMessagesCount, setUnreadAdminMessagesCount] = useState(0);
  const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
  const [isTotpSetupLoading, setIsTotpSetupLoading] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageError, setMessageError] = useState("");
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState("");
  const [totpSuccess, setTotpSuccess] = useState("");
  const [isTotpVerifying, setIsTotpVerifying] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { pathname } = useRouter();
  const { lastEvent } = useAdminSocket();

  const router = useRouter();

  useEffect(() => {
    const roles = getCurrentAdminRolesFromJwt();
    setIsSuperAdmin(roles.includes("SUPER_ADMIN"));
  }, []);

  useEffect(() => {
    const fetchPendingProviderSpecialSkills = async () => {
      try {
        const response = await getPendingProviderSpecialSkillsCount();
        const count = response.data?.total ?? response.data?.result?.total ?? 0;
        setPendingProviderSpecialSkillsCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
      }
    };
    const fetchNotEndedOrdersCount = async () => {
      try {
        const response = await getNotEndedOrdersCount();

        const count =
          response.data?.result?.count ??
          response.data?.count ??
          response.data?.result ??
          0;
        setNotEndedOrdersCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
        if (axios.isAxiosError(err)) {
          if (err.status === 401) {
            router.push("/");
          }
        }
      }
    };
    const fetchNotPaidOrdersCount = async () => {
      try {
        const response = await getNotPaidOrdersCount();

        const count =
          response.data?.result?.count ??
          response.data?.count ??
          response.data?.result ??
          0;
        setNotPaidOrdersCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
        if (axios.isAxiosError(err)) {
          if (err.status === 401) {
            router.push("/");
          }
        }
      }
    };
    const fetchCanceledPendingFinancialOrdersCount = async () => {
      try {
        const response = await getCanceledPendingFinancialOrdersCount();
        const count = response.data?.count ?? 0;
        setCanceledPendingFinancialCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
      }
    };
    const fetchNotFinishedOnboardingCount = async () => {
      try {
        const response = await getNotFinishedOnboardingUsers({ pageSize: 1 });
        const result = response.data?.result ?? response.data;
        const count = result?.total ?? 0;
        setNotFinishedOnboardingCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
      }
    };
    const fetchPendingCriminalChecksCount = async () => {
      try {
        const response = await getPendingCriminalRecordCount();
        const total = response.data?.total ?? 0;
        setPendingCriminalChecksCount(Number(total) || 0);
      } catch (err) {
        console.log(err);
      }
    };
    const fetchNotSolvedFeedback = async () => {
      try {
        const response = await getNotResolvedFeedbackCount();
        const count = response.data?.count ?? 0;
        setNotSolvedFeedbackCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
      }
    };
    const fetchNotReviewedDocumentsCount = async () => {
      try {
        const response = await getNotReviewedDocumentsCount();
        const count = response.data?.count ?? 0;
        setNotReviewedDocumentsCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
      }
    };
    const fetchNotResolvedReportsCount = async () => {
      try {
        const response = await getNotResolvedReportsCount();
        const count = response.data?.count ?? 0;
        setNotResolvedReportsCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
      }
    };
    const fetchUnreadAdminMessagesCount = async () => {
      try {
        const response = await getUnreadAdminMessagesCount();
        const count = response.data?.count ?? 0;
        setUnreadAdminMessagesCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
      }
    };

    fetchPendingProviderSpecialSkills();
    fetchNotEndedOrdersCount();
    fetchNotPaidOrdersCount();
    fetchCanceledPendingFinancialOrdersCount();
    fetchNotFinishedOnboardingCount();
    fetchPendingCriminalChecksCount();
    fetchNotSolvedFeedback();
    fetchNotReviewedDocumentsCount();
    fetchNotResolvedReportsCount();
    fetchUnreadAdminMessagesCount();
  }, [router]);

  useEffect(() => {
    const handlePendingProviderSpecialSkillsRefresh = async () => {
      try {
        const response = await getPendingProviderSpecialSkillsCount();
        const count = response.data?.total ?? response.data?.result?.total ?? 0;
        setPendingProviderSpecialSkillsCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
      }
    };

    window.addEventListener(
      "pending-provider-special-skills-count-refresh",
      handlePendingProviderSpecialSkillsRefresh,
    );

    return () => {
      window.removeEventListener(
        "pending-provider-special-skills-count-refresh",
        handlePendingProviderSpecialSkillsRefresh,
      );
    };
  }, []);

  useEffect(() => {
    const handleCriminalCheckStatusUpdated = async () => {
      try {
        const [criminalResponse, documentsResponse] = await Promise.all([
          getPendingCriminalRecordCount(),
          getNotReviewedDocumentsCount(),
        ]);
        setPendingCriminalChecksCount(
          Number(criminalResponse.data?.total ?? 0) || 0,
        );
        setNotReviewedDocumentsCount(
          Number(documentsResponse.data?.count ?? 0) || 0,
        );
      } catch (err) {
        console.log(err);
      }
    };

    window.addEventListener(
      "criminal-check-status-updated",
      handleCriminalCheckStatusUpdated,
    );

    return () => {
      window.removeEventListener(
        "criminal-check-status-updated",
        handleCriminalCheckStatusUpdated,
      );
    };
  }, []);

  useEffect(() => {
    const handleMessagesCountUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ count?: number }>;
      const count = customEvent.detail?.count;
      if (typeof count === "number") {
        setUnreadAdminMessagesCount(Math.max(count, 0));
      }
    };

    window.addEventListener(
      "admin-messages-count-update",
      handleMessagesCountUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "admin-messages-count-update",
        handleMessagesCountUpdate as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "FEEDBACK_CREATED") {
      setNotSolvedFeedbackCount((prev) => prev + 1);
    }

    if (lastEvent.type === "FEEDBACK_RESOLVED") {
      setNotSolvedFeedbackCount((prev) => Math.max(prev - 1, 0));
    }

    if (lastEvent.type === "USER_REPORTED") {
      setNotResolvedReportsCount((prev) => prev + 1);
    }

    if (lastEvent.type === "REPORT_RESOLVED") {
      setNotResolvedReportsCount((prev) => Math.max(prev - 1, 0));
    }

    if (lastEvent.type === "CRIMINAL_CHECK_SUBMITTED") {
      setPendingCriminalChecksCount((prev) => prev + 1);
    }

    if (lastEvent.type === "CRIMINAL_CHECK_APPROVED") {
      setPendingCriminalChecksCount((prev) => Math.max(prev - 1, 0));
    }

    if (lastEvent.type === "ADMIN_MESSAGE") {
      setUnreadAdminMessagesCount((prev) => prev + 1);
    }
  }, [lastEvent]);

  const ordersAttentionNumber =
    notEndedOrdersCount + notPaidOrdersCount + canceledPendingFinancialCount;
  const usersAttentionNumber =
    notFinishedOnboardingCount + pendingProviderSpecialSkillsCount;
  const visibleLinks = isSuperAdmin
    ? [{ title: "Super Access", link: "/super-access" }, ...links]
    : links;

  const openTotpSetupModal = async () => {
    if (isTotpSetupLoading) return;
    try {
      setIsTotpSetupLoading(true);
      setTotpError("");
      setTotpSuccess("");
      setTotpCode("");
      const response = await setupAdminTotp();
      const result = response.data?.result ?? response.data;
      setQrCodeDataUrl(result?.qrCodeDataUrl ?? "");
      setOtpauthUrl(result?.otpauthUrl ?? "");
      setIsTotpModalOpen(true);
    } catch (err) {
      console.error(err);
      setTotpError("Failed to prepare 2FA setup.");
      setIsTotpModalOpen(true);
    } finally {
      setIsTotpSetupLoading(false);
    }
  };

  const confirmTotpSetup = async () => {
    if (isTotpVerifying) return;
    if (!/^\d{6}$/.test(totpCode.trim())) {
      setTotpError("Enter a valid 6-digit code.");
      return;
    }
    try {
      setIsTotpVerifying(true);
      setTotpError("");
      await verifyAdminTotpSetup(totpCode.trim());
      setTotpSuccess("2FA enabled successfully.");
      setTimeout(() => {
        setIsTotpModalOpen(false);
        setTotpCode("");
        setTotpError("");
        setTotpSuccess("");
        setQrCodeDataUrl("");
        setOtpauthUrl("");
      }, 700);
    } catch (err) {
      console.error(err);
      setTotpError("Code is invalid or expired.");
      setTotpSuccess("");
    } finally {
      setIsTotpVerifying(false);
    }
  };

  const submitAdminMessage = async () => {
    if (isMessageSending) return;
    const text = messageText.trim();
    if (!text) {
      setMessageError("Enter message text.");
      return;
    }
    try {
      setIsMessageSending(true);
      setMessageError("");
      await postAdminMessage(text);
      setMessageText("");
      setIsMessageModalOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessageError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to send message.",
        );
        return;
      }
      setMessageError("Failed to send message.");
    } finally {
      setIsMessageSending(false);
    }
  };

  return (
    <>
      <div className={styles.main}>
        <button
          onClick={() => setMenuDisplayed(true)}
          className={styles.burgerBtn}
        >
          <img src={burgerBtn.src} alt="Burger button" />
        </button>
        <img className={styles.logoImg} src={logoImg.src} alt="Logo" />
        <nav className={styles.nav}>
          <ul>
            {visibleLinks.map((l) => (
              <li key={l.link}>
                <Link href={l.link}>
                  <HeaderButton
                    title={l.title}
                    isActive={`/${pathname.split("/")[1]}` === l.link}
                    icon={
                      l.link === "/messages" ? (
                        <MessagesIcon className={styles.headerMessagesIcon} />
                      ) : undefined
                    }
                    hideTitle={l.link === "/messages"}
                    attentionNumber={
                      l.link === "/orders"
                        ? ordersAttentionNumber > 0
                          ? ordersAttentionNumber
                          : undefined
                        : l.link === "/users" &&
                            usersAttentionNumber > 0
                          ? usersAttentionNumber
                        : l.link === "/feedback" &&
                            notSolvedFeedbackCount > 0
                          ? notSolvedFeedbackCount
                        : l.link === "/criminal-check" &&
                              pendingCriminalChecksCount > 0
                            ? pendingCriminalChecksCount
                        : l.link === "/documents" &&
                              notReviewedDocumentsCount > 0
                            ? notReviewedDocumentsCount
                          : l.link === "/messages" &&
                              unreadAdminMessagesCount > 0
                            ? unreadAdminMessagesCount
                          : l.link === "/reports" &&
                              notResolvedReportsCount > 0
                            ? notResolvedReportsCount
                          : undefined
                    }
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.logOutBtn}>
          <button
            type="button"
            className={styles.alertHeaderBtn}
            onClick={() => {
              setMessageError("");
              setIsMessageModalOpen(true);
            }}
          >
            <span>New</span>
            <MessagesIcon className={styles.alertHeaderIcon} />
          </button>
          <Button
            onClick={openTotpSetupModal}
            title={isTotpSetupLoading ? "Loading..." : "2FA setup"}
            type="OUTLINED"
            isDisabled={isTotpSetupLoading}
          />
          <Button
            onClick={() => {
              disconnectAdminSocket();
              Cookies.remove("@user_jwt");
              router.push("/");
            }}
            title="Logout"
            type="OUTLINED"
          />
        </div>
      </div>
      {isMenuDisplayed && (
        <HeaderMenu
          links={visibleLinks}
          onClose={() => setMenuDisplayed(false)}
          ordersAttentionNumber={ordersAttentionNumber}
          usersAttentionNumber={usersAttentionNumber}
          feedbackAttentionNumber={notSolvedFeedbackCount}
          criminalCheckAttentionNumber={pendingCriminalChecksCount}
          documentsAttentionNumber={notReviewedDocumentsCount}
          messagesAttentionNumber={unreadAdminMessagesCount}
          reportsAttentionNumber={notResolvedReportsCount}
        />
      )}
      {isTotpModalOpen && (
        <div className={styles.totpBackdrop}>
          <div className={`${styles.totpModal}`}>
            <h2 className={styles.totpTitle}>Set up 2FA</h2>
            <p className={styles.totpText}>
              Scan this QR code in Google Authenticator, then enter a 6-digit
              code to confirm.
            </p>
            {qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="TOTP QR code" className={styles.qrImg} />
            )}
            {otpauthUrl && (
              <a href={otpauthUrl} className={styles.otpLink}>
                Open otpauth URL
              </a>
            )}
            <input
              value={totpCode}
              onChange={(e) => {
                setTotpCode(e.target.value);
                setTotpError("");
              }}
              className={styles.totpInput}
              type="text"
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
            />
            {totpError && <p className={styles.totpError}>{totpError}</p>}
            {totpSuccess && <p className={styles.totpSuccess}>{totpSuccess}</p>}
            <div className={styles.totpActions}>
              <Button
                onClick={() => setIsTotpModalOpen(false)}
                title="Close"
                type="OUTLINED"
                isDisabled={isTotpVerifying}
              />
              <Button
                onClick={confirmTotpSetup}
                title={isTotpVerifying ? "Verifying..." : "Confirm"}
                type="BLACK"
                isDisabled={isTotpVerifying}
                isLoading={isTotpVerifying}
              />
            </div>
          </div>
        </div>
      )}
      {isMessageModalOpen && (
        <div className={styles.totpBackdrop}>
          <div className={styles.totpModal}>
            <h2 className={styles.alertModalTitle}>New admin message</h2>
            <p className={styles.totpText}>
              Send a message to all admins.
            </p>
            <textarea
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                setMessageError("");
              }}
              className={styles.alertTextarea}
              placeholder="Type message text"
            />
            {messageError && <p className={styles.totpError}>{messageError}</p>}
            <div className={styles.totpActions}>
              <Button
                onClick={() => setIsMessageModalOpen(false)}
                title="Close"
                type="OUTLINED"
                isDisabled={isMessageSending}
              />
              <Button
                onClick={submitAdminMessage}
                title={isMessageSending ? "Sending..." : "Send message"}
                type="BLACK"
                isDisabled={isMessageSending}
                isLoading={isMessageSending}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
