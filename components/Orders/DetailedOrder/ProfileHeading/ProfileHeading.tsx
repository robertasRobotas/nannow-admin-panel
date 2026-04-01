import { nunito } from "@/helpers/fonts";
import styles from "./profileHeading.module.css";

type ProfileHeadingProps = {
  sitterImgUrl: string;
  sitterName: string;
  parentImgUrl: string;
  parentName: string;
  sitterPhoneNo: string;
  parentPhoneNo: string;
  sitterProfileHref?: string;
  parentProfileHref?: string;
};

const ProfileHeading = ({
  sitterImgUrl,
  sitterName,
  parentImgUrl,
  parentName,
  sitterPhoneNo,
  parentPhoneNo,
  sitterProfileHref,
  parentProfileHref,
}: ProfileHeadingProps) => {
  return (
    <div className={styles.main}>
      <div className={styles.profile}>
        {sitterProfileHref ? (
          <a href={sitterProfileHref} className={styles.profileAvatarLink}>
            <img src={sitterImgUrl} alt="Provider avatar" />
          </a>
        ) : (
          <img src={sitterImgUrl} alt="Provider avatar" />
        )}
        <div className={styles.profileInfo}>
          <div className={styles.role}>PROVIDER</div>
          <div className={`${styles.userName} ${nunito.className}`}>
            {sitterName}
          </div>
          <div className={styles.phoneNo}>{sitterPhoneNo}</div>
        </div>
      </div>
      <div className={styles.profile}>
        {parentProfileHref ? (
          <a href={parentProfileHref} className={styles.profileAvatarLink}>
            <img src={parentImgUrl} alt="Client avatar" />
          </a>
        ) : (
          <img src={parentImgUrl} alt="Client avatar" />
        )}
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
