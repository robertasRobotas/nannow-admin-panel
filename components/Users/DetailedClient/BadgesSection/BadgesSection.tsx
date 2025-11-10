/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import styles from "./badgesSection.module.css";
import Button from "@/components/Button/Button";
import verifiedBadgeImg from "../../../../assets/images/verified_badge.svg";
import crownImg from "../../../../assets/images/crown.svg";
import shieldImg from "../../../../assets/images/shield.svg";
import { toggleProviderBadge } from "@/pages/api/fetch";

type BadgesSectionProps = {
  selectedBadges: string[];
  providerUserId: string;
  onBackClick: () => void;
};

type BadgeDef = {
  id: string;
  label: string;
  img: string;
};

const ALL_BADGES: BadgeDef[] = [
  { id: "verified", label: "Verified", img: verifiedBadgeImg.src },
  { id: "top", label: "Top", img: crownImg.src },
  {
    id: "crimilal_record_verified",
    label: "Criminal record verified",
    img: shieldImg.src,
  },
];

const BadgesSection = ({
  selectedBadges,
  providerUserId,
  onBackClick,
}: BadgesSectionProps) => {
  const [badges, setBadges] = useState<string[]>(selectedBadges ?? []);
  const [loadingId, setLoadingId] = useState<string | null>(null);
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

  return (
    <div className={styles.main}>
      <h3 className={styles.title}>Badges</h3>
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
    </div>
  );
};

export default BadgesSection;
