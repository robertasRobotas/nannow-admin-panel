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
  setUserSuspendedStatus,
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

const GeneralSection = ({ user, mode, onBackClick }: GeneralSectionProps) => {
  const [isSuspendedLocal, setIsSuspendedLocal] = useState(
    user?.user?.isSuspendedByAdmin ?? false,
  );
  const [isDeleteStripeModalOpen, setIsDeleteStripeModalOpen] = useState(false);
  const [isDeletingStripeAccount, setIsDeletingStripeAccount] = useState(false);
  const [isBasePriceModalOpen, setIsBasePriceModalOpen] = useState(false);
  const [basePriceInput, setBasePriceInput] = useState(
    typeof user?.provider?.baseProviderRate === "number"
      ? user.provider.baseProviderRate.toFixed(2)
      : "",
  );
  const [basePriceError, setBasePriceError] = useState<string | null>(null);
  const [isUpdatingBasePrice, setIsUpdatingBasePrice] = useState(false);

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

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>General info</h3>
      <div className={styles.infoCardsWrapper}>
        {cards.map((c, i) => (
          <div key={i} className={styles.card}>
            <img src={c.icon.src} alt="Icon" />

            <span className={styles.cardTitle}>{c.title}</span>
            <span className={`${styles.cardValue} ${nunito.className}`}>
              {c.value}
            </span>
            {c.booleanSwitch && (
              <button
                type="button"
                className={styles.suspendSwitch}
                onClick={c.booleanSwitch.onChange}
                disabled={isSuspendedSaving}
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
                title="Details"
                type="OUTLINED"
                onClick={() => router.push(c.link!)}
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
    </div>
  );
};

export default GeneralSection;
