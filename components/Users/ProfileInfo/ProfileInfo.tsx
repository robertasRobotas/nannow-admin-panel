import styles from "./profileInfo.module.css";
import { nunito } from "@/helpers/fonts";

type ProfileInfoProps = {
  name: string;
  imgUrl: string;
  id: string;
  mode?: "client" | "provider";
  email: string;
  locale?: string;
};

const ProfileInfo = ({
  name,
  imgUrl,
  id,
  mode,
  email,
  locale,
}: ProfileInfoProps) => {
  return (
    <div className={styles.profileInfo}>
      <img className={styles.profileImg} src={imgUrl} alt="Profile Image" />
      <span className={`${styles.name} ${nunito.className}`}>
        {name} {mode && (mode === "provider" ? "(Provider)" : "(Client)")}
      </span>
      <span className={styles.email}>{email}</span>
      <span className={styles.id}>{`USER ID: ${id}`}</span>
      {locale && (
        <span className={styles.email}>{`USER LOCALE: ${locale}`}</span>
      )}
    </div>
  );
};

export default ProfileInfo;
