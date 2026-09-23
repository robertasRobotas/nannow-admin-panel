import { useState } from "react";
import styles from "./profileCompletionSection.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { UserDetails } from "@/types/Client";
import {
  getProfileCompletion,
  type Region,
  type RequirementTone,
} from "@/data/profileCompletion";

const REGION_LABELS: Record<Region, string> = {
  LITHUANIA: "Lithuania",
  LATVIA: "Latvia",
  ESTONIA: "Estonia",
  FRANCE: "France",
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" strokeLinecap="round" />
      <path d="M12 16h.01" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" strokeLinecap="round" />
      <path d="M12 7.5h.01" strokeLinecap="round" />
    </svg>
  );
}

const TONE_ICON_CLASS: Record<RequirementTone, string> = {
  done: styles.reqIconDone,
  warn: styles.reqIconWarn,
  danger: styles.reqIconDanger,
  neutral: styles.reqIconNeutral,
};

const TONE_STATUS_CLASS: Record<RequirementTone, string> = {
  done: styles.reqStatusDone,
  warn: styles.reqStatusWarn,
  danger: styles.reqStatusDanger,
  neutral: styles.reqStatusNeutral,
};

const ToneIcon = ({ tone }: { tone: RequirementTone }) => {
  if (tone === "done") return <CheckIcon />;
  if (tone === "warn") return <ClockIcon />;
  if (tone === "danger") return <AlertIcon />;
  return <InfoIcon />;
};

type ProfileCompletionSectionProps = {
  user: UserDetails;
  mode: "client" | "provider";
  onBackClick: () => void;
};

const ProfileCompletionSection = ({
  user,
  mode,
  onBackClick,
}: ProfileCompletionSectionProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [showingCompleted, setShowingCompleted] = useState(false);

  const completion = getProfileCompletion(user, mode);
  const rows = completion.rows;
  const completedCount = rows.filter((row) => row.completed).length;
  const visibleRows = showingCompleted
    ? rows
    : rows.filter((row) => !row.completed);

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>Profile completion</h3>
      <div className={`${styles.card} ${nunito.className}`}>
        <div className={styles.cardHeader}>
          <span className={styles.trustTitle}>Trust Level</span>
          <span className={styles.regionChip}>{REGION_LABELS[completion.region]}</span>
        </div>
        <p className={styles.cardNote}>
          Mirrors the Trust Level card this user sees in the app. Requirements
          are region-gated, exactly like the onboarding gate.
        </p>

        {completion.isComplete ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>
              <CheckIcon />
            </div>
            <div>
              <h4 className={styles.successTitle}>Congrats!</h4>
              <p className={styles.successText}>
                All mandatory trust points are completed.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className={styles.progress}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion.percentage}
            >
              <div
                className={styles.progressFill}
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
            <p className={styles.progressLabel}>{completion.percentage}% complete</p>
            <p className={styles.warningNote}>
              The user sees a profile-completion warning in the app until all
              required steps are done.
            </p>
          </>
        )}

        {rows.length === 0 && (
          <p className={styles.empty}>
            No requirements configured for this region.
          </p>
        )}

        {visibleRows.length > 0 && (
          <ul className={styles.reqList}>
            {visibleRows.map((row) => (
              <li key={row.key} className={styles.req}>
                <span className={`${styles.reqIcon} ${TONE_ICON_CLASS[row.tone]}`}>
                  <ToneIcon tone={row.tone} />
                </span>
                <div className={styles.reqBody}>
                  <span className={styles.reqLabel}>{row.label}</span>
                  {row.hint && <span className={styles.reqHint}>{row.hint}</span>}
                </div>
                <span
                  className={`${styles.reqStatus} ${TONE_STATUS_CLASS[row.tone]}`}
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        {completedCount > 0 && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setShowingCompleted((prev) => !prev)}
          >
            {showingCompleted ? "Hide completed" : "Show completed"}
          </button>
        )}
      </div>

      {isMobile && (
        <div className={styles.backBtnWrapper}>
          <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionSection;
