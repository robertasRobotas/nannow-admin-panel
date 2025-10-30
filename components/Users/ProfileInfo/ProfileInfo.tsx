import styles from "./profileInfo.module.css";
import { nunito } from "@/helpers/fonts";

type ProfileInfoProps = {
  name: string;
  imgUrl: string;
  id: string;
};

const ProfileInfo = ({ name, imgUrl, id }: ProfileInfoProps) => {
  return (
    <div className={styles.profileInfo}>
      <img className={styles.profileImg} src={imgUrl} alt="Profile Image" />
      <span className={`${styles.name} ${nunito.className}`}>{name}</span>
      <span className={styles.id}>{`USER ID: ${id}`}</span>
    </div>
  );
};

export default ProfileInfo;
