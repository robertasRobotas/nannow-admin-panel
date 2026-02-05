import { nunito } from "@/helpers/fonts";
import styles from "./profileHeading.module.css";

type ProfileHeadingProps = {
  sitterImgUrl: string;
  sitterName: string;
  parentImgUrl: string;
  parentName: string;
  sitterPhoneNo: string;
  parentPhoneNo: string;
};

const ProfileHeading = ({
  sitterImgUrl,
  sitterName,
  parentImgUrl,
  parentName,
  sitterPhoneNo,
  parentPhoneNo,
}: ProfileHeadingProps) => {
  return (
    <div className={styles.main}>
      <div className={styles.profile}>
        <img src={sitterImgUrl} />
        <div className={styles.profileInfo}>
          <div className={styles.role}>PROVIDER</div>
          <div className={`${styles.userName} ${nunito.className}`}>
            {sitterName}
          </div>
          <div className={styles.phoneNo}>{sitterPhoneNo}</div>
        </div>
      </div>
      <div className={styles.profile}>
        <img src={parentImgUrl} />
        <div className={styles.profileInfo}>
          <div className={styles.role}>CLIENT</div>
          <div className={`${styles.userName} ${nunito.className}`}>
            {parentName}
          </div>
          <div className={styles.phoneNo}>{parentPhoneNo}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeading;
