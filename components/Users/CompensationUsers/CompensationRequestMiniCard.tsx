import { useEffect, useMemo, useState } from "react";
import styles from "./CompensationRequestMiniCard.module.css";
import requestStyles from "../CompensationRequests/compensationRequests.module.css";
import Button from "@/components/Button/Button";
import { UserWithCompensationDetails } from "./compensationPreview";
import {
  COMPENSATION_REQUEST_STATUS_ORDER,
  formatCompensationDateTime,
  formatCompensationRequestStatus,
  getCompensationRequestStatusTone,
  normalizeCompensationRequests,
} from "@/data/compensationRequests";
import { updateClientCompensationRequestStatus } from "@/pages/api/fetch";

type CompensationRequestMiniCardProps = {
  user: UserWithCompensationDetails;
  onUpdated?: () => void;
};

const normalizeCommentText = (value: unknown) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .filter((comment): comment is string => typeof comment === "string")
      .join("\n");
  }
  return "";
};

const getStatusToneClass = (
  tone: ReturnType<typeof getCompensationRequestStatusTone>,
) => {
  switch (tone) {
    case "requested":
      return styles.statusRequested;
    case "contacted":
      return styles.statusContacted;
    case "inProgress":
      return styles.statusInProgress;
    case "completed":
      return styles.statusCompleted;
    default:
      return styles.statusUnknown;
  }
};

const CompensationRequestMiniCard = ({
  user,
  onUpdated,
}: CompensationRequestMiniCardProps) => {
  const client = user.client;
  const apiClientId = client?.id ?? "";
  const request = useMemo(
    () => normalizeCompensationRequests(client)[0] ?? null,
    [client],
  );
  const [draftStatus, setDraftStatus] = useState("");
  const [draftComment, setDraftComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"status" | "save" | null>(
    null,
  );

  useEffect(() => {
    if (!request) {
      setDraftStatus("");
      setDraftComment("");
      setIsStatusPickerOpen(false);
      setIsSaveConfirmOpen(false);
      setPendingAction(null);
      return;
    }

    setDraftStatus(request.status);
    setDraftComment(normalizeCommentText(request.comments));
  }, [request]);

  const hasRequest = !!request;
  const isFallback = request?.isFallback ?? false;
  const requestStatusTone = request
    ? getCompensationRequestStatusTone(request.status)
    : "unknown";

  const handleSaveRequest = async () => {
    if (!request || request.isFallback || isSaving || !apiClientId) return;

    const nextComment = normalizeCommentText(draftComment).trim();
    if (!draftStatus.trim()) {
      setSaveError("Status is required.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      const previousStatus = request.status;
      await updateClientCompensationRequestStatus(apiClientId, request.id, {
        status: draftStatus as (typeof request)["status"],
        comment: nextComment,
      });
      const nextStatus = draftStatus as (typeof request)["status"];
      const hasAttentionChange =
        previousStatus !== nextStatus &&
        (previousStatus === "COMPLETED") !== (nextStatus === "COMPLETED");
      if (hasAttentionChange) {
        window.dispatchEvent(
          new CustomEvent("requested-compensation-info-count-refresh", {
            detail: {
              delta: nextStatus === "COMPLETED" ? -1 : 1,
            },
          }),
        );
      }
      onUpdated?.();
      setIsSaveConfirmOpen(false);
      setPendingAction(null);
    } catch (error) {
      console.log(error);
      setSaveError("Failed to update compensation request.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.main} data-row-nav-exclude>
      {!hasRequest ? (
        <div className={styles.empty}>No compensation request found</div>
      ) : (
        <>
          <div className={styles.header}>
            <div className={styles.titleWrap}>
              <div className={styles.title}>Latest request</div>
              <div className={styles.dateRow}>
                <div className={styles.meta}>
                  changed {formatCompensationDateTime(request.changedAt)}
                </div>
                <div className={styles.meta}>
                  requested{" "}
                  {formatCompensationDateTime(
                    request.requestedCompensationInfoAt,
                  )}
                </div>
              </div>
            </div>
          </div>

          {isFallback && (
            <div className={styles.fallbackNote}>
              Legacy compensation data cannot be updated inline.
            </div>
          )}

          {!isFallback && (
            <>
              <div className={styles.editorGrid}>
                <div className={styles.statusField}>
                  <div className={styles.fieldLabel}>Status</div>
                  <button
                    type="button"
                    className={`${styles.statusButton} ${getStatusToneClass(
                      requestStatusTone,
                    )}`}
                    onClick={() => setIsStatusPickerOpen(true)}
                    disabled={isSaving}
                  >
                    {formatCompensationRequestStatus(draftStatus)}
                  </button>
                </div>

                <div className={styles.commentField}>
                  <div className={styles.fieldLabel}>Comment</div>
                  <div className={styles.commentRow}>
                    <textarea
                      className={styles.textarea}
                      value={draftComment}
                      onChange={(event) => {
                        setDraftComment(event.target.value);
                        if (saveError) setSaveError(null);
                      }}
                      disabled={isSaving}
                      placeholder="Add or edit comment..."
                    />
                    <Button
                      title={isSaving ? "Saving..." : "Save"}
                      type="BLACK"
                      onClick={() => {
                        setSaveError(null);
                        setPendingAction("save");
                        setIsSaveConfirmOpen(true);
                      }}
                      isDisabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {saveError && <div className={styles.error}>{saveError}</div>}
            </>
          )}
        </>
      )}

      {isStatusPickerOpen && request && !isFallback && (
        <div
          className={requestStyles.confirmationBackdrop}
          onClick={() => setIsStatusPickerOpen(false)}
        >
          <div
            className={requestStyles.confirmationModal}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <h2 className={requestStyles.confirmationTitle}>Change status</h2>
            <p className={requestStyles.confirmationBody}>
              Select the new compensation request status.
            </p>
            <div className={styles.statusOptions}>
              {COMPENSATION_REQUEST_STATUS_ORDER.map((status) => (
                <Button
                  key={status}
                  title={status}
                  type={draftStatus === status ? "BLACK" : "OUTLINED"}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDraftStatus(status);
                    setIsStatusPickerOpen(false);
                    setSaveError(null);
                    setPendingAction("status");
                    setIsSaveConfirmOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {isSaveConfirmOpen && request && !isFallback && (
        <div
          className={requestStyles.confirmationBackdrop}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsSaveConfirmOpen(false);
            if (pendingAction === "status") {
              setDraftStatus(request.status);
            }
            setPendingAction(null);
          }}
        >
          <div
            className={requestStyles.confirmationModal}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <h2 className={requestStyles.confirmationTitle}>
              {pendingAction === "status" ? "Change status?" : "Save changes?"}
            </h2>
            <p className={requestStyles.confirmationBody}>
              {pendingAction === "status"
                ? `This will change the request status to ${formatCompensationRequestStatus(
                    draftStatus,
                  )} and save the current comment.`
                : "This will update the request status and save the current comment."}
            </p>
            <div className={requestStyles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={() => {
                  setIsSaveConfirmOpen(false);
                  if (pendingAction === "status") {
                    setDraftStatus(request.status);
                  }
                  setPendingAction(null);
                }}
                isDisabled={isSaving}
              />
              <Button
                title={isSaving ? "Saving..." : "Confirm"}
                type="BLACK"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSaveRequest();
                }}
                isDisabled={isSaving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompensationRequestMiniCard;
