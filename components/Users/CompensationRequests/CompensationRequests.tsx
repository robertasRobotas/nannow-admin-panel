import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./compensationRequests.module.css";
import { useMediaQuery } from "react-responsive";
import { useRouter } from "next/router";
import Button from "@/components/Button/Button";
import { nunito } from "@/helpers/fonts";
import {
  getClientById,
  updateClientCompensationRequestStatus,
} from "@/pages/api/fetch";
import { UserDetails } from "@/types/Client";
import {
  COMPENSATION_REQUEST_STATUS_ORDER,
  formatCompensationDateTime,
  formatCompensationRequestStatus,
  normalizeCompensationRequests,
} from "@/data/compensationRequests";

type CompensationRequestsProps = {
  clientId: string;
  onBackClick?: () => void;
};

const normalizeCommentText = (value: unknown) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.filter((comment): comment is string => typeof comment === "string").join("\n");
  }
  return "";
};

const CompensationRequests = ({
  clientId,
  onBackClick,
}: CompensationRequestsProps) => {
  const router = useRouter();
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [client, setClient] = useState<UserDetails | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [didInitializeSelection, setDidInitializeSelection] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftComment, setDraftComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "status" | "save" | null
  >(null);

  const fetchClient = useCallback(async (id: string) => {
    try {
      const response = await getClientById(id);
      setClient(response.data.clientDetails ?? response.data.result ?? null);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const requests = useMemo(
    () => normalizeCompensationRequests(client?.client),
    [client],
  );
  const apiClientId = client?.client?.id ?? "";

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) return null;
    return requests.find((request) => request.id === selectedRequestId) ?? null;
  }, [requests, selectedRequestId]);

  const activeRequest = useMemo(
    () => selectedRequest ?? requests[0] ?? null,
    [requests, selectedRequest],
  );

  useEffect(() => {
    if (!activeRequest) {
      setDraftStatus("");
      setDraftComment("");
      setIsStatusPickerOpen(false);
      setIsSaveConfirmOpen(false);
      setPendingAction(null);
      return;
    }

    setDraftStatus(activeRequest.status);
    setDraftComment(normalizeCommentText(activeRequest.comments));
  }, [activeRequest]);

  const updateRequestQuery = useCallback(
    (nextRequestId: string) => {
      if (!router.isReady) return;
      const nextQuery = { ...router.query };
      if (nextRequestId) {
        nextQuery.requestId = nextRequestId;
      } else {
        delete nextQuery.requestId;
      }

      router.push(
        {
          pathname: router.pathname,
          query: nextQuery,
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );

  useEffect(() => {
    if (!clientId) return;
    void fetchClient(clientId);
  }, [clientId, fetchClient]);

  useEffect(() => {
    if (!router.isReady) return;
    const requestIdFromQuery =
      typeof router.query.requestId === "string" ? router.query.requestId : "";
    setSelectedRequestId(requestIdFromQuery);
  }, [router.isReady, router.query.requestId]);

  useEffect(() => {
    if (didInitializeSelection || !requests.length) return;
    if (selectedRequestId) {
      setDidInitializeSelection(true);
      return;
    }
    setSelectedRequestId(requests[0].id);
    setDidInitializeSelection(true);
  }, [didInitializeSelection, requests, selectedRequestId]);

  const selectRequest = (nextRequestId: string) => {
    setSelectedRequestId(nextRequestId);
    setDidInitializeSelection(true);
    updateRequestQuery(nextRequestId);
  };

  const clearSelectedRequest = () => {
    setSelectedRequestId("");
    setDidInitializeSelection(true);
    setIsStatusPickerOpen(false);
    setIsSaveConfirmOpen(false);
    setPendingAction(null);
    updateRequestQuery("");
  };

  const handleSaveRequest = async () => {
    if (
      !activeRequest ||
      activeRequest.isFallback ||
      isSaving ||
      !apiClientId
    ) {
      return;
    }

    const nextComment = normalizeCommentText(draftComment).trim();
    if (!draftStatus.trim()) {
      setSaveError("Status is required.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      await updateClientCompensationRequestStatus(apiClientId, activeRequest.id, {
        status: draftStatus as (typeof activeRequest)["status"],
        comment: nextComment,
      });
      await fetchClient(clientId);
      setIsSaveConfirmOpen(false);
      setPendingAction(null);
    } catch (error) {
      console.log(error);
      setSaveError("Failed to update compensation request.");
    } finally {
      setIsSaving(false);
    }
  };

  const openStatusPicker = () => {
    if (!activeRequest || activeRequest.isFallback || isSaving) return;
    setIsStatusPickerOpen(true);
  };

  const requestSave = () => {
    if (!activeRequest || activeRequest.isFallback || isSaving) return;
    setSaveError(null);
    setPendingAction("save");
    setIsSaveConfirmOpen(true);
  };

  const renderRequestList = () => (
    <div className={styles.listPane}>
      <div className={`${styles.title} ${nunito.className}`}>
        <span>Compensation requests</span>
        <span className={styles.count}>{requests.length}</span>
      </div>

      <div className={styles.list}>
        {requests.length > 0 ? (
          requests.map((request) => {
            const highlightedRequest = isMobile
              ? selectedRequest
              : activeRequest;
            const isSelected = highlightedRequest?.id === request.id;
            const status = formatCompensationRequestStatus(request.status);
            return (
              <button
                key={request.id}
                type="button"
                className={`${styles.requestItem} ${
                  isSelected ? styles.requestItemSelected : ""
                }`}
                onClick={() => selectRequest(request.id)}
              >
                <div className={styles.requestItemHeader}>
                  <span className={styles.requestItemTitle}>
                    {status}
                  </span>
                  {request.isFallback && (
                    <span className={styles.fallbackBadge}>Legacy</span>
                  )}
                </div>
                <span className={styles.requestMeta}>
                  changed {formatCompensationDateTime(request.changedAt)}
                </span>
                <span className={styles.requestMeta}>
                  requested {formatCompensationDateTime(
                    request.requestedCompensationInfoAt,
                  )}
                </span>
              </button>
            );
          })
        ) : (
          <div className={styles.empty}>No compensation requests found</div>
        )}
      </div>

      {isMobile && (
        <div className={styles.backBtnWrapper}>
          <Button
            title="Back"
            onClick={() =>
              onBackClick ? onBackClick() : router.push(`/client/${clientId}`)
            }
            type="OUTLINED"
          />
        </div>
      )}
    </div>
  );

  const renderRequestDetails = () => {
    if (!activeRequest) {
      return (
        <div className={styles.detailsPane}>
          <div className={styles.emptyDetails}>Select a request</div>
        </div>
      );
    }

    return (
      <div className={styles.detailsPane}>
        <div className={styles.detailsHeader}>
          <div>
            <h3 className={`${styles.detailsTitle} ${nunito.className}`}>
              Details
            </h3>
            <div className={styles.detailsSubtitle}>
              {formatCompensationRequestStatus(activeRequest.status)}
            </div>
          </div>
          {isMobile && (
            <Button
              title="Back"
              type="OUTLINED"
              onClick={onBackClick ?? clearSelectedRequest}
            />
          )}
        </div>

        <section className={styles.detailCard}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Requested at</span>
            <span className={styles.detailValue}>
              {formatCompensationDateTime(
                activeRequest.requestedCompensationInfoAt,
              )}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Changed at</span>
            <span className={styles.detailValue}>
              {formatCompensationDateTime(activeRequest.changedAt)}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Status</span>
            <button
              type="button"
              className={`${styles.detailValue} ${styles.statusButton}`}
              onClick={openStatusPicker}
              disabled={activeRequest.isFallback || isSaving}
            >
              {formatCompensationRequestStatus(activeRequest.status)}
            </button>
          </div>
        </section>

        <section className={styles.detailCard}>
          <div className={styles.detailSectionTitle}>Comments</div>
          {activeRequest.isFallback ? (
            <div className={styles.emptyDetails}>
              Legacy compensation data cannot be updated from here.
            </div>
          ) : (
            <div className={styles.commentEditor}>
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
              {saveError && <div className={styles.error}>{saveError}</div>}
              <div className={styles.actions}>
                <Button
                  title={isSaving ? "Saving..." : "Save changes"}
                  type="BLACK"
                  onClick={requestSave}
                  isDisabled={isSaving}
                />
              </div>
            </div>
          )}
        </section>

        {activeRequest.isFallback && (
          <section className={styles.detailCard}>
            <div className={styles.detailSectionTitle}>Legacy data</div>
            <div className={styles.emptyDetails}>
              This record was synthesized from the older compensation fields.
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className={styles.main}>
      {isMobile ? (
        selectedRequest ? (
          renderRequestDetails()
        ) : (
          renderRequestList()
        )
      ) : (
        <>
          {renderRequestList()}
          {renderRequestDetails()}
        </>
      )}

      {isStatusPickerOpen && activeRequest && !activeRequest.isFallback && (
        <div
          className={styles.confirmationBackdrop}
          onClick={() => setIsStatusPickerOpen(false)}
        >
          <div
            className={styles.confirmationModal}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.confirmationTitle}>Change status</h2>
            <p className={styles.confirmationBody}>
              Select the new compensation request status.
            </p>
            <div className={styles.statusOptions}>
              {COMPENSATION_REQUEST_STATUS_ORDER.map(
                (status) => (
                  <Button
                    key={status}
                    title={status}
                    type={draftStatus === status ? "BLACK" : "OUTLINED"}
                    onClick={() => {
                      setDraftStatus(status);
                      setIsStatusPickerOpen(false);
                      setSaveError(null);
                      setPendingAction("status");
                      setIsSaveConfirmOpen(true);
                    }}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {isSaveConfirmOpen && activeRequest && !activeRequest.isFallback && (
        <div
          className={styles.confirmationBackdrop}
          onClick={() => {
            setIsSaveConfirmOpen(false);
            if (pendingAction === "status") {
              setDraftStatus(activeRequest.status);
            }
            setPendingAction(null);
          }}
        >
          <div
            className={styles.confirmationModal}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.confirmationTitle}>
              {pendingAction === "status" ? "Change status?" : "Save changes?"}
            </h2>
            <p className={styles.confirmationBody}>
              {pendingAction === "status"
                ? `This will change the request status to ${formatCompensationRequestStatus(
                    draftStatus,
                  )} and save the current comment.`
                : "This will update the request status and save the current comment."}
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={() => {
                  setIsSaveConfirmOpen(false);
                  if (pendingAction === "status") {
                    setDraftStatus(activeRequest.status);
                  }
                  setPendingAction(null);
                }}
                isDisabled={isSaving}
              />
              <Button
                title={isSaving ? "Saving..." : "Confirm"}
                type="BLACK"
                onClick={handleSaveRequest}
                isDisabled={isSaving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompensationRequests;
