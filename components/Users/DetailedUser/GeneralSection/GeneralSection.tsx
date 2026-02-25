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
} from "@/pages/api/fetch";
import axios from "axios";
import { toast } from "react-toastify";

type GeneralSectionProps = {
  user: UserDetails;
  mode: "client" | "provider";
  onBackClick: () => void;
};

const GeneralSection = ({ user, mode, onBackClick }: GeneralSectionProps) => {
  const [isSuspendedLocal, setIsSuspendedLocal] = useState(
    user?.user?.isSuspendedByAdmin ?? false,
  );
  const [isDeleteStripeModalOpen, setIsDeleteStripeModalOpen] = useState(false);
  const [isDeletingStripeAccount, setIsDeletingStripeAccount] = useState(false);

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
    </div>
  );
};

export default GeneralSection;
