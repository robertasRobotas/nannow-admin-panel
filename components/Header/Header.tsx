import styles from "./header.module.css";
import { HeaderLogo } from "./HeaderLogo";
import Link from "next/link";
import Button from "../Button/Button";
import burgerBtn from "../../assets/images/burger-btn.svg";
import { NavIcon } from "@/helpers/navIcons";
import { links } from "@/data/headerLinks";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import HeaderMenu from "./HeaderMenu/HeaderMenu";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  AdminApiMode,
  getAdminApiMode,
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
  setAdminApiMode,
  setupAdminTotp,
  verifyAdminTotpSetup,
} from "@/pages/api/fetch";
import axios from "axios";
import { disconnectAdminSocket } from "@/helpers/adminSocket";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";
import MessagesIcon from "@/components/Icons/MessagesIcon";
import { ChevronDown, LogOut, Server, Shield, User } from "lucide-react";

const Header = () => {
  const [isMenuDisplayed, setMenuDisplayed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profilePopoverMounted, setProfilePopoverMounted] = useState(false);
  const [profilePopoverVisible, setProfilePopoverVisible] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileRevealRafRef = useRef<number[]>([]);
  const [notEndedOrdersCount, setNotEndedOrdersCount] = useState(0);

  useEffect(() => {
    if (isProfileMenuOpen) {
      setProfilePopoverMounted(true);
      profileRevealRafRef.current.forEach((id) => cancelAnimationFrame(id));
      profileRevealRafRef.current = [];
      profileRevealRafRef.current.push(
        requestAnimationFrame(() => {
          profileRevealRafRef.current.push(
            requestAnimationFrame(() => setProfilePopoverVisible(true)),
          );
        }),
      );
      return () => {
        profileRevealRafRef.current.forEach((id) => cancelAnimationFrame(id));
        profileRevealRafRef.current = [];
      };
    }
    setProfilePopoverVisible(false);
    const t = window.setTimeout(() => setProfilePopoverMounted(false), 150);
    return () => window.clearTimeout(t);
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!profilePopoverMounted) return;
    const onPointerDown = (e: PointerEvent) => {
      if (profileMenuRef.current?.contains(e.target as Node)) return;
      setIsProfileMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsProfileMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profilePopoverMounted]);
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
  const [apiMode, setApiMode] = useState<AdminApiMode>("production");
  const { pathname } = useRouter();
  const { lastEvent } = useAdminSocket();

  const router = useRouter();

  useLayoutEffect(() => {
    setApiMode(getAdminApiMode());
  }, []);

  useEffect(() => {
    const roles = getCurrentAdminRolesFromJwt();
    setIsSuperAdmin(roles.includes("SUPER_ADMIN"));
  }, []);

  const toggleApiMode = () => {
    const nextMode: AdminApiMode =
      apiMode === "test" ? "production" : "test";
    setAdminApiMode(nextMode);
    setApiMode(nextMode);
    router.reload();
  };

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

  const getAttentionForLink = (link: string): number | undefined => {
    if (link === "/orders" && ordersAttentionNumber > 0) {
      return ordersAttentionNumber;
    }
    if (link === "/users" && usersAttentionNumber > 0) {
      return usersAttentionNumber;
    }
    if (link === "/feedback" && notSolvedFeedbackCount > 0) {
      return notSolvedFeedbackCount;
    }
    if (link === "/criminal-check" && pendingCriminalChecksCount > 0) {
      return pendingCriminalChecksCount;
    }
    if (link === "/documents" && notReviewedDocumentsCount > 0) {
      return notReviewedDocumentsCount;
    }
    if (link === "/messages" && unreadAdminMessagesCount > 0) {
      return unreadAdminMessagesCount;
    }
    if (link === "/reports" && notResolvedReportsCount > 0) {
      return notResolvedReportsCount;
    }
    return undefined;
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

  const activeSegment = `/${pathname.split("/")[1]}`;

  return (
    <>
      <div className={styles.root}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <Link
              href="/users"
              className={styles.logoLink}
              aria-label="Users"
            >
              <HeaderLogo mode={apiMode} className={styles.logoImg} />
            </Link>
          </div>
          <nav className={styles.nav}>
            <ul>
              {visibleLinks.map((l) => {
                const isActive = activeSegment === l.link;
                const attention = getAttentionForLink(l.link);
                return (
                  <li key={l.link}>
                    <Link
                      href={l.link}
                      className={`${styles.navLink} ${
                        isActive ? styles.navLinkActive : ""
                      }`}
                    >
                      <NavIcon path={l.link} className={styles.navIcon} />
                      <span className={styles.navTitle}>{l.title}</span>
                      {attention != null && (
                        <span
                          className={`${styles.attentionBubble}${
                            l.link === "/users"
                              ? ` ${styles.attentionBubbleUsers}`
                              : ""
                          }`}
                        >
                          {attention}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className={styles.sidebarFooter}>
            <div
              className={styles.sidebarApiRow}
              onClick={toggleApiMode}
            >
              <div className={styles.sidebarApiLabelGroup}>
                <Server
                  className={styles.navIcon}
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className={styles.navTitle}>Use Test API</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={apiMode === "test"}
                aria-label="Use Test API"
                className={styles.apiModeSwitch}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleApiMode();
                }}
              />
            </div>
            <div className={styles.sidebarProfileSection}>
              <div ref={profileMenuRef} className={styles.profileMenuAnchor}>
                <button
                  type="button"
                  className={styles.profileMenuTrigger}
                  id="desktop-profile-trigger"
                  onClick={() => setIsProfileMenuOpen((o) => !o)}
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="desktop-sidebar-profile-menu"
                >
                  <span className={styles.profileMenuTriggerLeft}>
                    <User
                      className={styles.navIcon}
                      size={18}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className={styles.navTitle}>Profile</span>
                  </span>
                  <ChevronDown
                    className={`${styles.profileMenuChevron} ${
                      isProfileMenuOpen ? styles.profileMenuChevronOpen : ""
                    }`}
                    size={18}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </button>
                {profilePopoverMounted && (
                  <div
                    id="desktop-sidebar-profile-menu"
                    role="menu"
                    aria-labelledby="desktop-profile-trigger"
                    className={`${styles.profileMenuPopover} ${
                      profilePopoverVisible
                        ? styles.profileMenuPopoverVisible
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.profileMenuItem}
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setMessageError("");
                        setIsMessageModalOpen(true);
                      }}
                    >
                      <MessagesIcon className={styles.navIcon} />
                      <span className={styles.navTitle}>New</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.profileMenuItem}
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        void openTotpSetupModal();
                      }}
                      disabled={isTotpSetupLoading}
                    >
                      <Shield
                        className={styles.navIcon}
                        size={18}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className={styles.navTitle}>
                        {isTotpSetupLoading ? "Loading..." : "2FA setup"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.profileMenuItem}
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        disconnectAdminSocket();
                        Cookies.remove("@user_jwt");
                        router.push("/");
                      }}
                    >
                      <LogOut
                        className={styles.navIcon}
                        size={18}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className={styles.navTitle}>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
        <div className={styles.mobileTop}>
          <button
            type="button"
            onClick={() => setMenuDisplayed(true)}
            className={styles.burgerBtn}
            aria-label="Open menu"
          >
            <img src={burgerBtn.src} alt="" />
          </button>
          <div className={styles.mobileLogoWrap}>
            <Link
              href="/users"
              className={styles.logoLink}
              aria-label="Users"
            >
              <HeaderLogo mode={apiMode} className={styles.logoImg} />
            </Link>
          </div>
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
          apiMode={apiMode}
          onToggleApiMode={toggleApiMode}
          onNewMessage={() => {
            setMessageError("");
            setIsMessageModalOpen(true);
            setMenuDisplayed(false);
          }}
          onTotpSetup={() => {
            setMenuDisplayed(false);
            void openTotpSetupModal();
          }}
          isTotpSetupLoading={isTotpSetupLoading}
          onLogout={() => {
            disconnectAdminSocket();
            Cookies.remove("@user_jwt");
            router.push("/");
          }}
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
