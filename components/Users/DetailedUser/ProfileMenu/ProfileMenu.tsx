import Button from "@/components/Button/Button";
import ProfileInfo from "../../ProfileInfo/ProfileInfo";
import ProfileMenuButtons from "../ProfileMenuButtons/ProfileMenuButtons";
import styles from "./profileMenu.module.css";
import trashImg from "../../../../assets/images/trash.svg";
import balanceImg from "../../../../assets/images/wallet.svg";
import { UserDetails } from "@/types/Client";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { anonymizeUser, deleteUser, getUserAnonymizationJob } from "@/pages/api/fetch";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { nunito } from "@/helpers/fonts";
import axios from "axios";

type AnonymizationJobStep = {
  key: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  error?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
};

type AnonymizationJob = {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  currentStep?: string | null;
  error?: string | null;
  warnings?: string[];
  steps?: AnonymizationJobStep[];
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  requestedByAdminId?: string;
  reason?: string;
};

const COMMON_ANONYMIZATION_STEPS = [
  "LOAD_USER",
  "PREPARE_ANONYMIZED_IDS",
  "ANONYMIZE_ADDRESSES",
  "ANONYMIZE_ORDERS",
  "ANONYMIZE_REVIEWS",
  "ANONYMIZE_DOCUMENTS",
  "ANONYMIZE_CHATS",
  "ANONYMIZE_FEEDBACK",
  "ANONYMIZE_PAYMENTS",
  "ANONYMIZE_PAYMENT_CUSTOMER",
  "ANONYMIZE_REPORTS",
  "ANONYMIZE_USER",
] as const;

const CLIENT_ANONYMIZATION_STEPS = [
  "CHECK_CLIENT_ORDERS",
  "ANONYMIZE_CHILDREN",
  "ANONYMIZE_CLIENT",
] as const;

const PROVIDER_ANONYMIZATION_STEPS = [
  "CHECK_PROVIDER_ORDERS",
  "DELETE_PROVIDER_STRIPE_ACCOUNT",
  "ANONYMIZE_PROVIDER",
] as const;

type ProfileMenuProps = {
  user: UserDetails;
  selectedSection: string;
  setIsSelectedMenu: () => void;
  setSelectedSection: Dispatch<SetStateAction<string>>;
  mode: "client" | "provider";
};

const ProfileMenu = ({
  user,
  setIsSelectedMenu,
  selectedSection,
  setSelectedSection,
  mode,
}: ProfileMenuProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnonymizeConfirmModalOpen, setIsAnonymizeConfirmModalOpen] =
    useState(false);
  const [isAnonymizationProgressModalOpen, setIsAnonymizationProgressModalOpen] =
    useState(false);
  const [anonymizationReason, setAnonymizationReason] = useState("");
  const [isStartingAnonymization, setIsStartingAnonymization] = useState(false);
  const [anonymizationJobId, setAnonymizationJobId] = useState("");
  const [anonymizationJob, setAnonymizationJob] =
    useState<AnonymizationJob | null>(null);
  const router = useRouter();

  const anonymizationStepKeys = useMemo(() => {
    const conditionalSteps =
      mode === "provider"
        ? PROVIDER_ANONYMIZATION_STEPS
        : CLIENT_ANONYMIZATION_STEPS;

    return [
      "LOAD_USER",
      ...conditionalSteps.filter((key) => key.startsWith("CHECK_")),
      "PREPARE_ANONYMIZED_IDS",
      "ANONYMIZE_ADDRESSES",
      "ANONYMIZE_ORDERS",
      "ANONYMIZE_REVIEWS",
      "ANONYMIZE_DOCUMENTS",
      "ANONYMIZE_CHATS",
      "ANONYMIZE_FEEDBACK",
      "ANONYMIZE_PAYMENTS",
      "ANONYMIZE_PAYMENT_CUSTOMER",
      "ANONYMIZE_REPORTS",
      ...(mode === "client" ? CLIENT_ANONYMIZATION_STEPS.slice(1) : []),
      ...(mode === "provider" ? PROVIDER_ANONYMIZATION_STEPS.slice(1) : []),
      "ANONYMIZE_USER",
    ];
  }, [mode]);

  useEffect(() => {
    if (!anonymizationJobId) return;
    if (
      anonymizationJob?.status === "COMPLETED" ||
      anonymizationJob?.status === "FAILED"
    ) {
      return;
    }

    let isCancelled = false;

    const pollJob = async () => {
      try {
        const response = await getUserAnonymizationJob(anonymizationJobId);
        const job = (response.data?.job ?? response.data?.result?.job) as
          | AnonymizationJob
          | undefined;
        if (!isCancelled && job) {
          setAnonymizationJob(job);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error(error);
        }
      }
    };

    pollJob();
    const intervalId = window.setInterval(pollJob, 2500);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [anonymizationJob?.status, anonymizationJobId]);

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!user.user.id) return;

    try {
      setIsDeleting(true);
      await deleteUser(user.user.id);

      toast.success("User was successfully deleted");

      // Redirect to users page after a short delay
      setTimeout(() => {
        router.push("/users");
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  const openAnonymizeModal = () => {
    setAnonymizationReason("");
    setIsAnonymizeConfirmModalOpen(true);
  };

  const closeAnonymizeModal = () => {
    if (isStartingAnonymization) return;
    setIsAnonymizeConfirmModalOpen(false);
  };

  const startAnonymization = async () => {
    if (!user.user.id || !anonymizationReason.trim() || isStartingAnonymization) {
      return;
    }

    try {
      setIsStartingAnonymization(true);
      const response = await anonymizeUser(user.user.id, anonymizationReason.trim());
      const job = (response.data?.job ?? response.data?.result?.job) as
        | AnonymizationJob
        | undefined;

      if (!job?.id) {
        toast.error("Failed to start anonymization");
        return;
      }

      setAnonymizationJobId(job.id);
      setAnonymizationJob(job);
      setIsAnonymizeConfirmModalOpen(false);
      setIsAnonymizationProgressModalOpen(true);
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        toast.error(
          (error.response?.data as { error?: string })?.error ??
            "Failed to start anonymization",
        );
      } else {
        toast.error("Failed to start anonymization");
      }
    } finally {
      setIsStartingAnonymization(false);
    }
  };

  const closeProgressModal = () => {
    setIsAnonymizationProgressModalOpen(false);
  };

  const getStepStatus = (stepKey: string) => {
    const matchedStep = anonymizationJob?.steps?.find((step) => step.key === stepKey);
    return matchedStep?.status ?? "PENDING";
  };

  return (
    <div className={styles.aside}>
      <div className={styles.profileWrapper}>
        <ProfileInfo
          name={`${user.user.firstName} ${user.user.lastName}`}
          imgUrl={user.user.imgUrl}
          id={user.user.id}
          mode={mode}
          email={user.user.email}
          locale={user.user.userAppLanguage}
          imgUrlRemoveMessage={user.user.imgUrlRemoveMessage}
          allowImageRemoval
          userId={user.user.id}
        />
        <div className={styles.balance}>
          <img src={balanceImg.src} alt="Balance" />

          {mode === "provider" && (
            <span> Total earnings: € {user?.provider?.totalEarnings}</span>
          )}
        </div>
      </div>
      <ProfileMenuButtons
        setIsSelectedMenu={setIsSelectedMenu}
        user={user}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        mode={mode}
      />
      <Button
        title="Delete profile"
        imgUrl={trashImg.src}
        type="OUTLINED"
        onClick={openDeleteModal}
      />
      <Button
        title="Anonimize user"
        type="OUTLINED"
        onClick={openAnonymizeModal}
      />

      {isDeleteModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Delete user?</h2>
            <p className={styles.confirmationBody}>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeDeleteModal}
                isDisabled={isDeleting}
              />
              <Button
                title={isDeleting ? "Deleting..." : "Delete"}
                type="DELETE"
                onClick={confirmDelete}
                isDisabled={isDeleting}
              />
            </div>
          </div>
        </div>
      )}
      {isAnonymizeConfirmModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Anonimize user?</h2>
            <p className={styles.confirmationBody}>
              Enter a reason before starting anonymization.
            </p>
            <textarea
              className={styles.reasonTextarea}
              value={anonymizationReason}
              onChange={(event) => setAnonymizationReason(event.target.value)}
              placeholder="Requested by support"
            />
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeAnonymizeModal}
                isDisabled={isStartingAnonymization}
              />
              <Button
                title={isStartingAnonymization ? "Starting..." : "Confirm"}
                type="BLACK"
                onClick={startAnonymization}
                isDisabled={
                  isStartingAnonymization || anonymizationReason.trim().length === 0
                }
              />
            </div>
          </div>
        </div>
      )}
      {isAnonymizationProgressModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div
            className={`${styles.confirmationModal} ${styles.progressModal} ${nunito.className}`}
          >
            <h2 className={styles.confirmationTitle}>Anonymization progress</h2>
            <p className={styles.confirmationBody}>
              {`Job: ${anonymizationJobId || "—"} • Status: ${
                anonymizationJob?.status ?? "PENDING"
              }`}
            </p>
            {anonymizationJob?.currentStep && (
              <p className={styles.currentStepText}>
                {`Current step: ${anonymizationJob.currentStep}`}
              </p>
            )}
            {anonymizationJob?.error && (
              <p className={styles.progressError}>{anonymizationJob.error}</p>
            )}
            {Array.isArray(anonymizationJob?.warnings) &&
              anonymizationJob!.warnings!.length > 0 && (
                <div className={styles.warningsList}>
                  {anonymizationJob!.warnings!.map((warning) => (
                    <div key={warning} className={styles.warningItem}>
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            <div className={styles.stepsList}>
              {anonymizationStepKeys.map((stepKey) => {
                const matchedStep = anonymizationJob?.steps?.find(
                  (step) => step.key === stepKey,
                );
                const stepStatus = getStepStatus(stepKey);
                return (
                  <div key={stepKey} className={styles.stepRow}>
                    <div className={styles.stepKey}>{stepKey}</div>
                    <div
                      className={`${styles.stepStatus} ${
                        styles[`stepStatus${stepStatus}`]
                      }`}
                    >
                      {stepStatus}
                    </div>
                    {matchedStep?.error && (
                      <div className={styles.stepError}>{matchedStep.error}</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className={styles.confirmationActions}>
              <Button
                title={
                  anonymizationJob?.status === "COMPLETED" ||
                  anonymizationJob?.status === "FAILED"
                    ? "Close"
                    : "Hide"
                }
                type="OUTLINED"
                onClick={closeProgressModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
