import styles from "./profileInfo.module.css";
import { nunito } from "@/helpers/fonts";

type ProfileInfoProps = {
  name: string;
  imgUrl: string;
  id: string;
  mode: "client" | "provider";
};

const ProfileInfo = ({ name, imgUrl, id, mode }: ProfileInfoProps) => {
  return (
    <div className={styles.profileInfo}>
      <img className={styles.profileImg} src={imgUrl} alt="Profile Image" />
      <span className={`${styles.name} ${nunito.className}`}>
        {name} {mode && (mode === "provider" ? "(Provider)" : "(Client)")}
      </span>
      <span className={styles.id}>{`USER ID: ${id}`}</span>
    </div>
  );
};

export default ProfileInfo;
