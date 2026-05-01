import { getInfoCards } from "@/data/generalInfoCards";
import styles from "./generalSection.module.css";
import { nunito } from "@/helpers/fonts";
import { UserDetails } from "@/types/Client";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  deleteProviderStripeAccount,
  setUserBanStatus,
  setUserSuspendedStatus,
  updateClientRequestedCompensationInfoAt,
  updateProviderFields,
} from "@/pages/api/fetch";
import axios from "axios";
import { toast } from "react-toastify";

type GeneralSectionProps = {
  user: UserDetails;
  mode: "client" | "provider";
  onBackClick: () => void;
};

type BasePriceParseResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

const normalizeRequestedCompensationInfoAt = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime()) && date.getTime() === 0) return null;
  return value;
};

const GeneralSection = ({ user, mode, onBackClick }: GeneralSectionProps) => {
  const [isSuspendedLocal, setIsSuspendedLocal] = useState(
    user?.user?.isSuspendedByAdmin ?? false,
  );
  const [isDeleteStripeModalOpen, setIsDeleteStripeModalOpen] = useState(false);
  const [isDeletingStripeAccount, setIsDeletingStripeAccount] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banReasonError, setBanReasonError] = useState<string | null>(null);
  const [isSavingBanStatus, setIsSavingBanStatus] = useState(false);
  const [isBasePriceModalOpen, setIsBasePriceModalOpen] = useState(false);
  const [basePriceInput, setBasePriceInput] = useState(
    typeof user?.provider?.baseProviderRate === "number"
      ? user.provider.baseProviderRate.toFixed(2)
      : "",
  );
  const [basePriceError, setBasePriceError] = useState<string | null>(null);
  const [isUpdatingBasePrice, setIsUpdatingBasePrice] = useState(false);
  const [openedVideoUrl, setOpenedVideoUrl] = useState<string | null>(null);
  const [
    requestedCompensationInfoAtLocal,
    setRequestedCompensationInfoAtLocal,
  ] = useState<string | null>(
    normalizeRequestedCompensationInfoAt(
      user?.client?.requestedCompensationInfoAt,
    ),
  );
  const [isCompensationModalOpen, setIsCompensationModalOpen] = useState(false);
  const [isCompensationSaving, setIsCompensationSaving] = useState(false);

  console.log(user.provider);
  const [isSuspendedSaving, setIsSuspendedSaving] = useState(false);
  const cards = getInfoCards(user, mode, {
    suspendedSwitch: {
      value: isSuspendedLocal,
      onChange: async () => {
        if (isSuspendedSaving) return;
        const next = !isSuspendedLocal;
        try {
          setIsSuspendedSaving(true);
          setIsSuspendedLocal(next);
          await setUserSuspendedStatus(user?.user?.id, next);
        } catch (err) {
          console.log(err);
          setIsSuspendedLocal((prev) => !prev);
          if (axios.isAxiosError(err)) {
            if (err.status === 401) {
              router.push("/");
            }
          }
        } finally {
          setIsSuspendedSaving(false);
        }
      },
    },
    compensationRequestSwitch:
      mode === "client"
        ? {
            value: !!requestedCompensationInfoAtLocal,
            onChange: () => setIsCompensationModalOpen(true),
            disabled: isCompensationSaving,
          }
        : undefined,
    requestedCompensationInfoAt: requestedCompensationInfoAtLocal,
  });
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const router = useRouter();
  console.log(user);

  const openDeleteStripeModal = () => {
    setIsDeleteStripeModalOpen(true);
  };

  const closeDeleteStripeModal = () => {
    setIsDeleteStripeModalOpen(false);
  };

  const confirmDeleteStripeAccount = async () => {
    if (!user?.user?.id || isDeletingStripeAccount) return;

    try {
      setIsDeletingStripeAccount(true);
      await deleteProviderStripeAccount(user.user.id);
      toast.success("Stripe account was deleted");
      closeDeleteStripeModal();
      router.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete stripe account");
    } finally {
      setIsDeletingStripeAccount(false);
    }
  };

  const openBasePriceModal = () => {
    setBasePriceInput(
      typeof user?.provider?.baseProviderRate === "number"
        ? user.provider.baseProviderRate.toFixed(2)
        : "",
    );
    setBasePriceError(null);
    setIsBasePriceModalOpen(true);
  };

  const openBanModal = () => {
    setBanReason("");
    setBanReasonError(null);
    setIsBanModalOpen(true);
  };

  const closeBanModal = () => {
    if (isSavingBanStatus) return;
    setIsBanModalOpen(false);
    setBanReasonError(null);
  };

  const confirmBanStatusChange = async () => {
    if (!user?.user?.id || isSavingBanStatus) return;
    const isCurrentlyBanned = !!user?.user?.isBannedByAdmin;
    const isBanning = !isCurrentlyBanned;

    if (isBanning && banReason.trim().length === 0) {
      setBanReasonError("Reason is required.");
      return;
    }

    try {
      setIsSavingBanStatus(true);
      await setUserBanStatus(
        user.user.id,
        isBanning,
        isBanning ? banReason.trim() : undefined,
      );
      toast.success(isBanning ? "User was banned" : "User was unbanned");
      setIsBanModalOpen(false);
      if (isBanning) {
        await router.replace("/users?view=banned");
        return;
      }
      router.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to change user ban status");
    } finally {
      setIsSavingBanStatus(false);
    }
  };

  const closeBasePriceModal = () => {
    if (isUpdatingBasePrice) return;
    setIsBasePriceModalOpen(false);
    setBasePriceError(null);
  };

  const parseBasePriceValue = (rawValue: string): BasePriceParseResult => {
    const normalized = rawValue.trim().replace(",", ".");
    if (normalized.length === 0) {
      return { ok: false, error: "Price is required." };
    }
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      return { ok: false, error: "Use numeric value with up to 2 decimals." };
    }
    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) {
      return { ok: false, error: "Invalid price value." };
    }
    if (parsed < 0) {
      return { ok: false, error: "Price cannot be negative." };
    }
    return { ok: true, value: parsed };
  };

  const parsedBasePrice = parseBasePriceValue(basePriceInput);
  const basePricePreview =
    parsedBasePrice.ok ? `€ ${parsedBasePrice.value.toFixed(2)}` : "—";

  const confirmChangeBasePrice = async () => {
    if (!user?.provider?.id || isUpdatingBasePrice) return;
    if (!parsedBasePrice.ok) {
      setBasePriceError(parsedBasePrice.error);
      return;
    }

    try {
      setIsUpdatingBasePrice(true);
      setBasePriceError(null);
      await updateProviderFields(user.provider.id, {
        baseProviderRate: parsedBasePrice.value,
      });
      toast.success("Base price updated");
      setIsBasePriceModalOpen(false);
      router.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update base price");
    } finally {
      setIsUpdatingBasePrice(false);
    }
  };

  const closeCompensationModal = () => {
    if (isCompensationSaving) return;
    setIsCompensationModalOpen(false);
  };

  const confirmCompensationStatusChange = async () => {
    if (!user?.client?.id || isCompensationSaving) return;
    const nextStatus = !requestedCompensationInfoAtLocal;

    try {
      setIsCompensationSaving(true);
      const response = await updateClientRequestedCompensationInfoAt(
        user.client.id,
        nextStatus ? true : null,
      );
      const result = response.data?.result ?? response.data ?? {};
      const nextRequestedAt = nextStatus
        ? (normalizeRequestedCompensationInfoAt(
            result.requestedCompensationInfoAt ??
              result.client?.requestedCompensationInfoAt,
          ) ?? new Date().toISOString())
        : null;
      setRequestedCompensationInfoAtLocal(nextRequestedAt);
      setIsCompensationModalOpen(false);
      window.dispatchEvent(
        new CustomEvent("requested-compensation-info-count-refresh", {
          detail: { delta: nextStatus ? 1 : -1 },
        }),
      );
      toast.success(
        nextStatus
          ? "Compensation request was set"
          : "Compensation request was cleared",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to change compensation request status");
    } finally {
      setIsCompensationSaving(false);
    }
  };

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>General info</h3>
      <div className={styles.infoCardsWrapper}>
        {cards.map((c, i) => (
          <div key={i} className={styles.card}>
            <img src={c.icon.src} alt="Icon" />

            <span className={styles.cardTitle}>{c.title}</span>
            {!c.hideValue && !c.linkValueText && (
              <span className={`${styles.cardValue} ${nunito.className}`}>
                {c.value}
              </span>
            )}
            {!c.hideValue && c.link && c.linkValueText && (
              <a
                href={c.link}
                target={c.link.startsWith("http") ? "_blank" : undefined}
                rel={
                  c.link.startsWith("http") ? "noopener noreferrer" : undefined
                }
                className={`${styles.cardValue} ${styles.cardValueLink} ${nunito.className}`}
              >
                {c.linkValueText}
              </a>
            )}
            {c.booleanSwitch && (
              <button
                type="button"
                className={styles.suspendSwitch}
                onClick={c.booleanSwitch.onChange}
                disabled={c.booleanSwitch.disabled ?? isSuspendedSaving}
              >
                <span
                  className={`${styles.suspendSwitchUi} ${
                    c.booleanSwitch.value ? styles.suspendSwitchUiActive : ""
                  }`}
                />
              </button>
            )}
            {c.link && (
              <Button
                title={c.linkButtonTitle ?? "Details"}
                type="OUTLINED"
                onClick={() => {
                  if (c.linkButtonTitle === "Open video" && c.link) {
                    setOpenedVideoUrl(c.link);
                    return;
                  }
                  if (c.link?.startsWith("http")) {
                    window.open(c.link, "_blank", "noopener,noreferrer");
                    return;
                  }
                  router.push(c.link!);
                }}
              />
            )}
            {c.actionButton?.action === "DELETE_STRIPE" && mode === "provider" && (
              <Button
                title={c.actionButton.title}
                type="OUTLINED"
                onClick={openDeleteStripeModal}
              />
            )}
            {c.actionButton?.action === "CHANGE_BASE_PRICE" &&
              mode === "provider" && (
                <Button
                  title={c.actionButton.title}
                  type="OUTLINED"
                  onClick={openBasePriceModal}
                />
              )}
            {c.actionButton?.action === "BAN_USER" && (
              <Button
                title={c.actionButton.title}
                type="OUTLINED"
                onClick={openBanModal}
              />
            )}
          </div>
        ))}
      </div>
      {isMobile && (
        <div className={styles.backBtnWrapper}>
          <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        </div>
      )}

      {isDeleteStripeModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Delete Stripe account?</h2>
            <p className={styles.confirmationBody}>
              Are you sure you want to delete the provider Stripe account?
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeDeleteStripeModal}
                isDisabled={isDeletingStripeAccount}
              />
              <Button
                title={
                  isDeletingStripeAccount ? "Deleting..." : "Delete stripe account"
                }
                type="DELETE"
                onClick={confirmDeleteStripeAccount}
                isDisabled={isDeletingStripeAccount}
              />
            </div>
          </div>
        </div>
      )}

      {isBasePriceModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Change base price?</h2>
            <div className={styles.inputBlock}>
              <label className={styles.inputLabel} htmlFor="base-price-input">
                Base price
              </label>
              <input
                id="base-price-input"
                type="text"
                inputMode="decimal"
                value={basePriceInput}
                onChange={(e) => {
                  setBasePriceInput(e.target.value);
                  setBasePriceError(null);
                }}
                className={styles.textInput}
                placeholder="e.g. 9.50"
                disabled={isUpdatingBasePrice}
              />
              {basePriceError && (
                <span className={styles.inputError}>{basePriceError}</span>
              )}
            </div>
            <p className={styles.confirmationBody}>
              Confirm setting provider base price to <b>{basePricePreview}</b>.
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeBasePriceModal}
                isDisabled={isUpdatingBasePrice}
              />
              <Button
                title={isUpdatingBasePrice ? "Updating..." : "Confirm"}
                type="BLACK"
                onClick={confirmChangeBasePrice}
                isDisabled={isUpdatingBasePrice}
              />
            </div>
          </div>
        </div>
      )}

      {isBanModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>
              {user?.user?.isBannedByAdmin ? "Unban user?" : "Ban user?"}
            </h2>
            {!user?.user?.isBannedByAdmin && (
              <div className={styles.inputBlock}>
                <label className={styles.inputLabel} htmlFor="ban-reason-input">
                  Reason
                </label>
                <input
                  id="ban-reason-input"
                  type="text"
                  value={banReason}
                  onChange={(e) => {
                    setBanReason(e.target.value);
                    setBanReasonError(null);
                  }}
                  className={styles.textInput}
                  placeholder="Enter reason..."
                  disabled={isSavingBanStatus}
                />
                {banReasonError && (
                  <span className={styles.inputError}>{banReasonError}</span>
                )}
              </div>
            )}
            <p className={styles.confirmationBody}>
              Banned users are visible in the Users page under the{" "}
              <b>Banned users</b> list.
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeBanModal}
                isDisabled={isSavingBanStatus}
              />
              <Button
                title={isSavingBanStatus ? "Saving..." : "Confirm"}
                type="BLACK"
                onClick={confirmBanStatusChange}
                isDisabled={isSavingBanStatus}
              />
            </div>
          </div>
        </div>
      )}

      {isCompensationModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>
              {requestedCompensationInfoAtLocal
                ? "Clear compensation request?"
                : "Set compensation request?"}
            </h2>
            <p className={styles.confirmationBody}>
              {requestedCompensationInfoAtLocal
                ? "This will remove the compensation request status from this client."
                : "This will mark this client as requested for compensation info."}
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeCompensationModal}
                isDisabled={isCompensationSaving}
              />
              <Button
                title={isCompensationSaving ? "Saving..." : "Confirm"}
                type="BLACK"
                onClick={confirmCompensationStatusChange}
                isDisabled={isCompensationSaving}
              />
            </div>
          </div>
        </div>
      )}

      {openedVideoUrl && (
        <div
          className={styles.videoOverlay}
          onClick={() => setOpenedVideoUrl(null)}
        >
          <div
            className={styles.videoModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.videoHeader}>
              <h2 className={styles.videoTitle}>Profile video</h2>
              <Button
                title="Close"
                type="OUTLINED"
                onClick={() => setOpenedVideoUrl(null)}
              />
            </div>
            <video
              className={styles.videoPlayer}
              controls
              playsInline
              preload="metadata"
            >
              <source src={openedVideoUrl} />
            </video>
            <a
              className={styles.videoFallbackLink}
              href={openedVideoUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open source URL
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralSection;
