import styles from "./profile.module.css";
import crossImg from "../../../../assets/images/cross-circle.svg";
import checkmarkImg from "../../../../assets/images/circle-checkmark.svg";
import clockImg from "../../../../assets/images/clock.svg";
import questionImg from "../../../../assets/images/question.svg";
import arrowOutImg from "../../../../assets/images/arrow-out.svg";
import { useRouter } from "next/router";

type ProfileProps = {
  status: "APPROVED" | "REJECTED" | "PENDING" | "NOT_SUBMITTED";
  imgUrl: string;
  name: string;
  id: string;
  changedAt?: string | Date | null;
};

const Profile = ({ status, imgUrl, name, id, changedAt }: ProfileProps) => {
  const icons = {
    APPROVED: checkmarkImg.src,
    REJECTED: crossImg.src,
    PENDING: clockImg.src,
    NOT_SUBMITTED: questionImg.src,
  };

  const router = useRouter();

  const changedAtText = (() => {
    if (!changedAt) return null;
    const date = new Date(changedAt);
    if (Number.isNaN(date.getTime())) return String(changedAt);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  })();

  return (
    <div
      onClick={() => {
        router.push(`/criminal-check/${id}`);
      }}
      className={styles.main}
    >
      <img className={styles.statusIcon} src={icons[status] ?? questionImg.src} />
      <div className={styles.profile}>
        <img src={imgUrl} />
        <div className={styles.profileDetails}>
          <div className={styles.name}>
            <span>{name}</span>
            <img src={arrowOutImg.src} />
          </div>

          <span className={styles.id}>{id}</span>
        </div>
      </div>
      {changedAtText && (
        <div className={styles.changedAtWrap}>
          <span className={styles.changedAtLabel}>Last changed</span>
          <span className={styles.changedAtValue}>{changedAtText}</span>
        </div>
      )}
    </div>
  );
};

export default Profile;
