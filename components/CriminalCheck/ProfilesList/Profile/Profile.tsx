import styles from "./profile.module.css";
import crossImg from "../../../../assets/images/cross-circle.svg";
import checkmarkImg from "../../../../assets/images/circle-checkmark.svg";
import clockImg from "../../../../assets/images/clock.svg";
import questionImg from "../../../../assets/images/question.svg";

type ProfileProps = {
  status: "APPROVED" | "REJECTED" | "PENDING" | "NOT_SUBMITTED";
  imgUrl: string;
  name: string;
  id: string;
};

const Profile = ({ status, imgUrl, name, id }: ProfileProps) => {
  const icons = {
    APPROVED: checkmarkImg.src,
    REJECTED: crossImg.src,
    PENDING: clockImg.src,
    NOT_SUBMITTED: questionImg.src,
  };
  return (
    <div className={styles.main}>
      <img src={icons[status] ?? questionImg.src} />
      <div className={styles.profile}>
        <img src={imgUrl} />
        <div className={styles.profileDetails}>
          <span className={styles.name}>{name}</span>
          <span className={styles.id}>{id}</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
