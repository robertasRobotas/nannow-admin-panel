import { User } from "@/types/CriminalCheckUser";
import styles from "./detailedCriminalCheck.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import crossImg from "../../../assets/images/cross.svg";
import checkmarkImg from "../../../assets/images/check-black.svg";
import clockImg from "../../../assets/images/clock.svg";
import questionImg from "../../../assets/images/question.svg";
import { useState } from "react";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import {
  applyCriminalRecordApplicationDecision,
  getDocumentById,
} from "@/pages/api/fetch";
import VerifiedType from "./VerifiedType/VerifiedType";
import RecordChangedAt from "./RecordChangedAt/RecordChangedAt";
import CriminalRecordCode from "./CriminalRecordCode/CriminalRecordCode";
import CriminalRecordComment from "./CriminalRecordComment/CriminalRecordComment";
import defaultUserImg from "../../../assets/images/default-avatar.png";
import { toast } from "react-toastify";
import docImg from "../../../assets/images/doc.svg";

type DetailedCriminalCheckProps = {
  user: User;
};

const DetailedCriminalCheck = ({ user }: DetailedCriminalCheckProps) => {
  const [notes, setNotes] = useState(
    user?.provider?.criminalRecordStatusAdminNotes ?? [],
  );
  const criminalRecordDocUrls = user?.provider?.criminalRecordDocUrls ?? [];
  const applications = user?.provider?.criminalRecord?.applications ?? [];

  const decisionOptions = [
    { title: "Approve and set current", value: "APPROVE_AND_SET_CURRENT" },
    { title: "Reject and set current", value: "REJECT_AND_SET_CURRENT" },
    { title: "Reject history only", value: "REJECT_HISTORY_ONLY" },
    { title: "Set pending current", value: "SET_PENDING_CURRENT" },
    { title: "Set not submitted current", value: "SET_NOT_SUBMITTED_CURRENT" },
  ] as const;
  const [appSelections, setAppSelections] = useState<Record<string, number>>(
    () =>
      applications.reduce<Record<string, number>>((acc, app) => {
        acc[app.id] = 0;
        return acc;
      }, {}),
  );
  const [appComments, setAppComments] = useState<Record<string, string>>({});
  const [appSaving, setAppSaving] = useState<Record<string, boolean>>({});
  const [openingDocumentIds, setOpeningDocumentIds] = useState<
    Record<string, boolean>
  >({});
  const verifiedType =
    user?.provider?.criminalRecord?.currentVerifiedType ??
    user?.provider?.criminalRecordVerifiedType ??
    "";
  const changedAt = user?.provider?.criminalRecord?.currentChangedAt
    ? new Date(user.provider.criminalRecord.currentChangedAt).toISOString()
    : (user?.provider?.criminalRecordChangedAt ?? "");
  const verifiedAt = user?.provider?.criminalRecordVerifiedAt ?? "";

  const statusPresentation: Record<
    "APPROVED" | "NOT_SUBMITTED" | "PENDING" | "REJECTED",
    { title: string; icon: string }
  > = {
    APPROVED: { title: "Approved", icon: checkmarkImg.src },
    NOT_SUBMITTED: { title: "Not submitted", icon: questionImg.src },
    PENDING: { title: "Pending", icon: clockImg.src },
    REJECTED: { title: "Rejected", icon: crossImg.src },
  };
  const newCurrentStatus = user?.provider?.criminalRecord?.currentStatus;
  const hasNewCriminalRecordFields =
    typeof newCurrentStatus === "string" || Array.isArray(applications);
  const hasCriminalRecordApplications = applications.length > 0;
  const rawCurrentStatus =
    hasNewCriminalRecordFields &&
    hasCriminalRecordApplications &&
    newCurrentStatus
      ? newCurrentStatus
      : (user?.provider?.criminalRecordStatus ??
        newCurrentStatus ??
        "NOT_SUBMITTED");
  const normalizedCurrentStatus = (
    rawCurrentStatus.toUpperCase() as "APPROVED" | "NOT_SUBMITTED" | "PENDING" | "REJECTED"
  );
  const currentStatus =
    normalizedCurrentStatus in statusPresentation
      ? normalizedCurrentStatus
      : "NOT_SUBMITTED";
  const currentStatusUi = statusPresentation[currentStatus];

  const getFileName = (url: string) => {
    const m = url?.match(/[^\\/]+$/);
    return m ? m[0] : url;
  };

  const formatDateTime = (value?: string | Date | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const openDocumentInNewTab = (documentUrl: string) => {
    if (!documentUrl) {
      toast.error("Document URL is missing.");
      return;
    }

    const openedWindow = window.open(
      documentUrl,
      "_blank",
      "noopener,noreferrer",
    );
    if (openedWindow) return;

    const a = document.createElement("a");
    a.href = documentUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openDocumentById = async (documentId: string) => {
    if (!documentId) return;

    try {
      setOpeningDocumentIds((prev) => ({ ...prev, [documentId]: true }));
      const response = await getDocumentById(documentId);
      const documentData = response?.data?.result ?? response?.data?.document;
      const documentUrl = documentData?.documentUrl;
      const documentCategory = documentData?.documentCategory;

      if (!documentUrl) {
        toast.error("Document URL not found.");
        return;
      }

      if (documentCategory && documentCategory !== "CRIMINAL_CHECK") {
        toast.error(`Invalid document category: ${documentCategory}`);
        return;
      }

      openDocumentInNewTab(documentUrl);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load document.");
    } finally {
      setOpeningDocumentIds((prev) => ({ ...prev, [documentId]: false }));
    }
  };

  const onApplyDecision = async (appId: string) => {
    const application = applications.find((item) => item.id === appId);
    if (!application) {
      toast.error("Application not found.");
      return;
    }

    const selectedDecision =
      decisionOptions[appSelections[appId] ?? 0]?.value ??
      "APPROVE_AND_SET_CURRENT";
    const comment = (appComments[appId] ?? "").trim();

    if (
      (selectedDecision === "REJECT_AND_SET_CURRENT" ||
        selectedDecision === "REJECT_HISTORY_ONLY") &&
      comment.length === 0
    ) {
      toast.error("Comment is required for reject decisions.");
      return;
    }

    try {
      setAppSaving((prev) => ({ ...prev, [appId]: true }));
      await applyCriminalRecordApplicationDecision(user.id, {
        applicationId: appId,
        decision: selectedDecision,
        criminalRejectionText: comment.length > 0 ? comment : undefined,
        documentIds: application.source?.documentIds ?? [],
      });

      toast("Application decision applied.");
      window.location.reload();
    } catch (err) {
      console.log(err);
      toast.error("Failed to apply decision.");
    } finally {
      setAppSaving((prev) => ({ ...prev, [appId]: false }));
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.heading}>
        <div className={styles.profile}>
          <img
            src={user.imgUrl === "" ? defaultUserImg.src : user.imgUrl}
            alt="Profile img"
          />
          <span
            className={`${styles.name} ${nunito.className}`}
          >{`${user.firstName} ${user.lastName}`}</span>
        </div>
        <div className={styles.buttons}>
          <div className={styles.currentStatus}>
            <img src={currentStatusUi.icon} alt={currentStatusUi.title} />
            <span>{currentStatusUi.title}</span>
          </div>
        </div>
      </div>
      <div className={styles.criminalCheckInfo}>
        <VerifiedType verifiedType={verifiedType} />
        <RecordChangedAt changedAt={changedAt} verifiedAt={verifiedAt} />
        {user?.provider?.criminalRecordCode && (
          <CriminalRecordCode code={user.provider.criminalRecordCode} />
        )}
        <CriminalRecordComment
          notes={notes}
          userId={user.id}
          setNotes={setNotes}
        />
        <div className={styles.applicationsSection}>
          <span className={styles.applicationsTitle}>APPLICATIONS</span>
          {applications.length === 0 && (
            <span className={styles.emptyApplications}>
              No criminal record applications.
            </span>
          )}
          {[...applications].reverse().map((app, index) => {
            const isLastApplication = index === 0;
            const statusUi = statusPresentation[app.status];
            const documents =
              app.source.documentIds && app.source.documentIds.length > 0
                ? app.source.documentIds
                : criminalRecordDocUrls;

            return (
              <div key={app.id} className={styles.applicationCard}>
                <div className={styles.applicationHeader}>
                  <span className={styles.applicationType}>
                    {app.verificationType}
                  </span>
                  <span className={styles.applicationStatus}>
                    <img src={statusUi.icon} alt={statusUi.title} />
                    <span>{statusUi.title}</span>
                  </span>
                </div>
                <div className={styles.applicationMeta}>
                  <span>Applied at: {formatDateTime(app.createdAt)}</span>
                  <span>Decided at: {formatDateTime(app.decidedAt)}</span>
                  <span>
                    Admin:{" "}
                    {app.decidedByAdminName ??
                      app.decidedByAdminId ??
                      "Auto/System"}
                  </span>
                </div>
                {app.rejectionReason &&
                  app.rejectionReason.trim().length > 0 && (
                    <div className={styles.rejectionReason}>
                      Rejection reason: {app.rejectionReason}
                    </div>
                  )}

                {app.verificationType === "QR" ? (
                  <div className={styles.qrInfo}>
                    <span>
                      Auto check: {app.decisionContext?.autoDecisionBy ?? "—"}
                    </span>
                    <span>
                      Name match:{" "}
                      {app.decisionContext?.isNameMatch ? "YES" : "NO"}
                    </span>
                    <span>
                      Police full name: {app.policeCheck?.fullName ?? "—"}
                    </span>
                    <span>Issued at: {app.policeCheck?.issuedAt ?? "—"}</span>
                    <span>Expires at: {app.policeCheck?.expiresAt ?? "—"}</span>
                  </div>
                ) : (
                  <div className={styles.documentsList}>
                    {documents.length === 0 && (
                      <span className={styles.emptyApplications}>
                        No attached documents.
                      </span>
                    )}
                    {documents.map((doc) => {
                      const isDocumentUrl =
                        /^https?:\/\//i.test(doc) || doc.startsWith("/");
                      const key = isDocumentUrl ? doc : `id:${doc}`;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={styles.documentLink}
                          onClick={() =>
                            isDocumentUrl
                              ? openDocumentInNewTab(doc)
                              : openDocumentById(doc)
                          }
                          disabled={!isDocumentUrl && openingDocumentIds[doc]}
                        >
                          <img src={docImg.src} alt="Document" />
                          <span>
                            {isDocumentUrl ? getFileName(doc) : doc}
                            {!isDocumentUrl && openingDocumentIds[doc]
                              ? " (opening...)"
                              : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {isLastApplication && (
                  <div className={styles.pendingActions}>
                    <div className={styles.pendingControls}>
                      <DropDownButton
                        options={decisionOptions.map((o) => ({
                          title: o.title,
                          value: o.value,
                        }))}
                        selectedOption={appSelections[app.id] ?? 0}
                        setSelectedOption={(value) =>
                          setAppSelections((prev) => ({
                            ...prev,
                            [app.id]:
                              typeof value === "function"
                                ? value(prev[app.id] ?? 0)
                                : value,
                          }))
                        }
                      />
                      <Button
                        title="Apply"
                        type="BLACK"
                        onClick={() => onApplyDecision(app.id)}
                        isDisabled={appSaving[app.id] === true}
                      />
                    </div>
                    <textarea
                      className={styles.applicationComment}
                      placeholder="Comment (required for REJECT_AND_SET_CURRENT)"
                      value={appComments[app.id] ?? ""}
                      onChange={(e) =>
                        setAppComments((prev) => ({
                          ...prev,
                          [app.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DetailedCriminalCheck;
