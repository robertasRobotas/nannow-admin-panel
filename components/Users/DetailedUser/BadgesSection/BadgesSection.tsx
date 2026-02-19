/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import styles from "./badgesSection.module.css";
import verifiedBadgeImg from "../../../../assets/images/verified_badge.svg";
import crownImg from "../../../../assets/images/crown.svg";
import shieldImg from "../../../../assets/images/shield.svg";
import { toggleProviderBadge, toggleUserVerified } from "@/pages/api/fetch";

type BadgesSectionProps = {
  mode: "client" | "provider";
  selectedBadges: string[];
  providerUserId: string;
  userId: string;
  userIsVerified: boolean;
  isProviderCriminalRecordVerified: boolean;
  onBackClick: () => void;
};

type BadgeDef = {
  id: string;
  label: string;
  img: string;
};

const ALL_BADGES: BadgeDef[] = [
  { id: "top", label: "Top", img: crownImg.src },
  {
    id: "crimilal_record_verified",
    label: "Criminal record verified",
    img: shieldImg.src,
  },
];

const BadgesSection = ({
  mode,
  selectedBadges,
  providerUserId,
  userId,
  userIsVerified,
  isProviderCriminalRecordVerified,
}: BadgesSectionProps) => {
  const [badges, setBadges] = useState<string[]>(selectedBadges ?? []);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(!!userIsVerified);
  const selectedSet = useMemo(() => new Set(badges), [badges]);
  const providerBadges = useMemo(
    () =>
      ALL_BADGES.filter(
        (badge) =>
          badge.id !== "crimilal_record_verified" ||
          isProviderCriminalRecordVerified,
      ),
    [isProviderCriminalRecordVerified],
  );

  const handleToggle = async (badgeId: string) => {
    try {
      setLoadingId(badgeId);
      await toggleProviderBadge(providerUserId, badgeId);
      setBadges((prev) =>
        prev.includes(badgeId)
          ? prev.filter((b) => b !== badgeId)
          : [...prev, badgeId],
      );
    } catch (err) {
      console.log(err);
      // optionally show toast
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleVerified = async () => {
    try {
      setVerifyLoading(true);
      await toggleUserVerified(userId);
      setIsVerified((prev) => !prev);
    } catch (err) {
      console.log(err);
    } finally {
      setVerifyLoading(false);
    }
  };

  const openCriminalCheckPage = () => {
    window.open(`/criminal-check/${userId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.main}>
      <div className={styles.category}>
        <h3 className={styles.title}>User Badges</h3>
        <div className={styles.list}>
          <div className={styles.badgeRow}>
            <div className={styles.badgeInfo}>
              <img src={verifiedBadgeImg.src} alt="Verified user icon" />
              <span className={styles.badgeTitle}>Verified user</span>
            </div>
            <button
              type="button"
              className={styles.suspendSwitch}
              onClick={handleToggleVerified}
              disabled={verifyLoading}
            >
              <span
                className={`${styles.suspendSwitchUi} ${
                  isVerified ? styles.suspendSwitchUiActive : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {mode === "provider" && (
        <div className={styles.category}>
          <h3 className={styles.title}>Provider Badges</h3>
          <div className={styles.list}>
            {providerBadges.map((b) => {
              const isCriminalRecordBadge =
                b.id === "crimilal_record_verified";
              const isActive = isCriminalRecordBadge
                ? isProviderCriminalRecordVerified
                : selectedSet.has(b.id);
              return (
                <div key={b.id} className={styles.badgeRow}>
                  <div className={styles.badgeInfo}>
                    <img src={b.img} alt={`${b.label} icon`} />
                    <span className={styles.badgeTitle}>{b.label}</span>
                  </div>
                  <button
                    type="button"
                    className={`${styles.suspendSwitch} ${
                      isCriminalRecordBadge ? styles.readOnlySwitch : ""
                    }`}
                    onClick={() =>
                      isCriminalRecordBadge
                        ? openCriminalCheckPage()
                        : handleToggle(b.id)
                    }
                    disabled={!isCriminalRecordBadge && !!loadingId}
                  >
                    <span
                      className={`${styles.suspendSwitchUi} ${
                        isActive ? styles.suspendSwitchUiActive : ""
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgesSection;
