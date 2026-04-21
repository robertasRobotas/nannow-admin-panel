import { AdminApiMode } from "@/pages/api/fetch";
import { HeaderLink } from "@/types/HeaderLink";
import styles from "./headerMenu.module.css";
import headerStyles from "../header.module.css";
import crossImg from "../../../assets/images/cross.svg";
import prodLogo from "../../../assets/images/prod-logo.svg";
import testLogo from "../../../assets/images/test-logo.svg";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { NavIcon } from "@/helpers/navIcons";
import MessagesIcon from "@/components/Icons/MessagesIcon";
import { ChevronDown, LogOut, Server, Shield, User } from "lucide-react";

type HeaderMenuProps = {
  links: HeaderLink[];
  onClose: () => void;
  ordersAttentionNumber?: number;
  usersAttentionNumber?: number;
  feedbackAttentionNumber?: number;
  criminalCheckAttentionNumber?: number;
  documentsAttentionNumber?: number;
  messagesAttentionNumber?: number;
  reportsAttentionNumber?: number;
  apiMode?: AdminApiMode;
  onToggleApiMode?: () => void;
  onNewMessage?: () => void;
  onTotpSetup?: () => void;
  isTotpSetupLoading?: boolean;
  onLogout?: () => void;
};

const getAttentionForLink = (
  link: string,
  props: Pick<
    HeaderMenuProps,
    | "ordersAttentionNumber"
    | "usersAttentionNumber"
    | "feedbackAttentionNumber"
    | "criminalCheckAttentionNumber"
    | "documentsAttentionNumber"
    | "messagesAttentionNumber"
    | "reportsAttentionNumber"
  >,
): number | undefined => {
  const {
    ordersAttentionNumber,
    usersAttentionNumber,
    feedbackAttentionNumber,
    criminalCheckAttentionNumber,
    documentsAttentionNumber,
    messagesAttentionNumber,
    reportsAttentionNumber,
  } = props;
  if (link === "/orders" && (ordersAttentionNumber ?? 0) > 0) {
    return ordersAttentionNumber;
  }
  if (link === "/users" && (usersAttentionNumber ?? 0) > 0) {
    return usersAttentionNumber;
  }
  if (link === "/feedback" && (feedbackAttentionNumber ?? 0) > 0) {
    return feedbackAttentionNumber;
  }
  if (link === "/criminal-check" && (criminalCheckAttentionNumber ?? 0) > 0) {
    return criminalCheckAttentionNumber;
  }
  if (link === "/documents" && (documentsAttentionNumber ?? 0) > 0) {
    return documentsAttentionNumber;
  }
  if (link === "/messages" && (messagesAttentionNumber ?? 0) > 0) {
    return messagesAttentionNumber;
  }
  if (link === "/reports" && (reportsAttentionNumber ?? 0) > 0) {
    return reportsAttentionNumber;
  }
  return undefined;
};

const HeaderMenu = ({
  links,
  onClose,
  ordersAttentionNumber,
  usersAttentionNumber,
  feedbackAttentionNumber,
  criminalCheckAttentionNumber,
  documentsAttentionNumber,
  messagesAttentionNumber,
  reportsAttentionNumber,
  apiMode,
  onToggleApiMode,
  onNewMessage,
  onTotpSetup,
  isTotpSetupLoading,
  onLogout,
}: HeaderMenuProps) => {
  const logoSrc =
    (apiMode ?? "production") === "test" ? testLogo.src : prodLogo.src;
  const [isClosing, setClosing] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profilePopoverMounted, setProfilePopoverMounted] = useState(false);
  const [profilePopoverVisible, setProfilePopoverVisible] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileRevealRafRef = useRef<number[]>([]);

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
  const { pathname } = useRouter();
  const activeSegment = `/${pathname.split("/")[1]}`;

  const attentionProps = {
    ordersAttentionNumber,
    usersAttentionNumber,
    feedbackAttentionNumber,
    criminalCheckAttentionNumber,
    documentsAttentionNumber,
    messagesAttentionNumber,
    reportsAttentionNumber,
  };

  const requestClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 350);
  };

  return (
    <div
      className={`${styles.overlay} ${styles.slideInRight} ${
        isClosing && styles.slideOutLeft
      }`}
      onClick={requestClose}
    >
      <div
        className={styles.main}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.logo}>
          <button
            type="button"
            onClick={requestClose}
            className={styles.closeBtn}
            aria-label="Close menu"
          >
            <img src={crossImg.src} alt="" />
          </button>
          <Link
            href="/users"
            className={headerStyles.logoLink}
            aria-label="Users"
            onClick={() => onClose()}
          >
            <img className={styles.logoImg} src={logoSrc} alt="" />
          </Link>
        </div>
        <nav className={styles.nav}>
          <ul>
            {links.map((l) => {
              const isActive = activeSegment === l.link;
              const attention = getAttentionForLink(l.link, attentionProps);
              return (
                <li key={l.link}>
                  <Link
                    href={l.link}
                    onClick={() => onClose()}
                    className={`${headerStyles.navLink} ${
                      isActive ? headerStyles.navLinkActive : ""
                    }`}
                  >
                    <NavIcon path={l.link} className={headerStyles.navIcon} />
                    <span className={headerStyles.navTitle}>{l.title}</span>
                    {attention != null && (
                      <span
                        className={`${headerStyles.attentionBubble}${
                          l.link === "/users"
                            ? ` ${headerStyles.attentionBubbleUsers}`
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
        {(onToggleApiMode ||
          onNewMessage ||
          onTotpSetup ||
          onLogout) && (
          <div className={styles.footer}>
            {onToggleApiMode && (
              <div
                className={headerStyles.sidebarApiRow}
                onClick={onToggleApiMode}
              >
                <div className={headerStyles.sidebarApiLabelGroup}>
                  <Server
                    className={headerStyles.navIcon}
                    size={18}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className={headerStyles.navTitle}>Use Test API</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={apiMode === "test"}
                  aria-label="Use Test API"
                  className={headerStyles.apiModeSwitch}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleApiMode();
                  }}
                />
              </div>
            )}
            {(onNewMessage || onTotpSetup || onLogout) && (
              <div
                className={
                  onToggleApiMode ? headerStyles.sidebarProfileSection : undefined
                }
              >
                <div
                  ref={profileMenuRef}
                  className={headerStyles.profileMenuAnchor}
                >
              <button
                type="button"
                className={headerStyles.profileMenuTrigger}
                id="mobile-profile-trigger"
                onClick={() => setIsProfileMenuOpen((o) => !o)}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                aria-controls="mobile-sidebar-profile-menu"
              >
                <span className={headerStyles.profileMenuTriggerLeft}>
                  <User
                    className={headerStyles.navIcon}
                    size={18}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className={headerStyles.navTitle}>Profile</span>
                </span>
                <ChevronDown
                  className={`${headerStyles.profileMenuChevron} ${
                    isProfileMenuOpen ? headerStyles.profileMenuChevronOpen : ""
                  }`}
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </button>
              {profilePopoverMounted && (
                <div
                  id="mobile-sidebar-profile-menu"
                  role="menu"
                  aria-labelledby="mobile-profile-trigger"
                  className={`${headerStyles.profileMenuPopover} ${
                    profilePopoverVisible
                      ? headerStyles.profileMenuPopoverVisible
                      : ""
                  }`}
                >
                  {onNewMessage && (
                    <button
                      type="button"
                      role="menuitem"
                      className={headerStyles.profileMenuItem}
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onNewMessage();
                      }}
                    >
                      <MessagesIcon className={headerStyles.navIcon} />
                      <span className={headerStyles.navTitle}>New</span>
                    </button>
                  )}
                  {onTotpSetup && (
                    <button
                      type="button"
                      role="menuitem"
                      className={headerStyles.profileMenuItem}
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onTotpSetup();
                      }}
                      disabled={isTotpSetupLoading}
                    >
                      <Shield
                        className={headerStyles.navIcon}
                        size={18}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className={headerStyles.navTitle}>
                        {isTotpSetupLoading ? "Loading..." : "2FA setup"}
                      </span>
                    </button>
                  )}
                  {onLogout && (
                    <button
                      type="button"
                      role="menuitem"
                      className={headerStyles.profileMenuItem}
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOut
                        className={headerStyles.navIcon}
                        size={18}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className={headerStyles.navTitle}>Logout</span>
                    </button>
                  )}
                </div>
              )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderMenu;
