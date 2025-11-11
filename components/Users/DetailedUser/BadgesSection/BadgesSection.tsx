/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import styles from "./badgesSection.module.css";
import Button from "@/components/Button/Button";
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
  onBackClick,
}: BadgesSectionProps) => {
  const [badges, setBadges] = useState<string[]>(selectedBadges ?? []);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(!!userIsVerified);
  const selectedSet = useMemo(() => new Set(badges), [badges]);

  const handleToggle = async (badgeId: string) => {
    try {
      setLoadingId(badgeId);
      await toggleProviderBadge(providerUserId, badgeId);
      setBadges((prev) =>
        prev.includes(badgeId)
          ? prev.filter((b) => b !== badgeId)
          : [...prev, badgeId]
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

  return (
    <div className={styles.main}>
      <h3 className={styles.title}>User Badges</h3>
      <div className={styles.grid}>
        <button
          className={`${styles.badgeButton} ${isVerified ? styles.active : ""}`}
          onClick={handleToggleVerified}
          disabled={verifyLoading}
        >
          <img src={verifiedBadgeImg.src} alt="Verified user icon" />
          <span>Verified user</span>
        </button>
      </div>

      {mode === "provider" && (
        <>
          <h3 className={styles.title}>Provider Badges</h3>
          <div className={styles.grid}>
            {ALL_BADGES.map((b) => {
              const isActive = selectedSet.has(b.id);
              return (
                <button
                  key={b.id}
                  className={`${styles.badgeButton} ${
                    isActive ? styles.active : ""
                  }`}
                  onClick={() => handleToggle(b.id)}
                  disabled={!!loadingId}
                >
                  <img src={b.img} alt={`${b.label} icon`} />
                  <span>{b.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default BadgesSection;
