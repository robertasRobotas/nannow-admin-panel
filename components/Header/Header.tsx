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
  getCurrentAdminRolesFromJwt,
  getNotFinishedOnboardingUsers,
  getNotEndedOrdersCount,
  getNotPaidOrdersCount,
  setupAdminTotp,
  verifyAdminTotpSetup,
} from "@/pages/api/fetch";
import axios from "axios";

const Header = () => {
  const [isMenuDisplayed, setMenuDisplayed] = useState(false);
  const [notEndedOrdersCount, setNotEndedOrdersCount] = useState(0);
  const [notPaidOrdersCount, setNotPaidOrdersCount] = useState(0);
  const [canceledPendingFinancialCount, setCanceledPendingFinancialCount] =
    useState(0);
  const [notFinishedOnboardingCount, setNotFinishedOnboardingCount] =
    useState(0);
  const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
  const [isTotpSetupLoading, setIsTotpSetupLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState("");
  const [totpSuccess, setTotpSuccess] = useState("");
  const [isTotpVerifying, setIsTotpVerifying] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { pathname } = useRouter();

  const router = useRouter();

  useEffect(() => {
    const roles = getCurrentAdminRolesFromJwt();
    setIsSuperAdmin(roles.includes("SUPER_ADMIN"));
  }, []);

  useEffect(() => {
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

    fetchNotEndedOrdersCount();
    fetchNotPaidOrdersCount();
    fetchCanceledPendingFinancialOrdersCount();
    fetchNotFinishedOnboardingCount();
  }, [router]);

  const ordersAttentionNumber =
    notEndedOrdersCount + notPaidOrdersCount + canceledPendingFinancialCount;
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
                    attentionNumber={
                      l.link === "/orders"
                        ? ordersAttentionNumber > 0
                          ? ordersAttentionNumber
                          : undefined
                        : l.link === "/users" &&
                            notFinishedOnboardingCount > 0
                          ? notFinishedOnboardingCount
                          : undefined
                    }
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.logOutBtn}>
          <Button
            onClick={openTotpSetupModal}
            title={isTotpSetupLoading ? "Loading..." : "2FA setup"}
            type="OUTLINED"
            isDisabled={isTotpSetupLoading}
          />
          <Button
            onClick={() => {
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
          usersAttentionNumber={notFinishedOnboardingCount}
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
    </>
  );
};

export default Header;
