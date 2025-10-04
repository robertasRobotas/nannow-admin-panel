import { nunito } from "@/helpers/fonts";
import styles from "./profileHeading.module.css";

type ProfileHeadingProps = {
  sitterImgUrl: string;
  sitterName: string;
  parentImgUrl: string;
  parentName: string;
};

const ProfileHeading = ({
  sitterImgUrl,
  sitterName,
  parentImgUrl,
  parentName,
}: ProfileHeadingProps) => {
  return (
    <div className={styles.main}>
      <div className={styles.profile}>
        <img src={sitterImgUrl} />
        <div className={styles.profileInfo}>
          <div className={styles.role}>Sitter</div>
          <div className={`${styles.userName} ${nunito.className}`}>
            {sitterName}
          </div>
        </div>
      </div>
      <div className={styles.profile}>
        <img src={parentImgUrl} />
        <div className={styles.profileInfo}>
          <div className={styles.role}>Parent</div>
          <div className={`${styles.userName} ${nunito.className}`}>
            {parentName}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeading;
