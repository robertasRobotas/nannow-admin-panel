import { CriminalCheckUser } from "@/types/CriminalCheckUser";
import styles from "./profilesList.module.css";
import Profile from "./Profile/Profile";
import defaultUserImg from "../../../assets/images/default-avatar.png";

type ProfilesListProps = {
  users: CriminalCheckUser[];
};

const ProfilesList = ({ users }: ProfilesListProps) => {
  return (
    <div className={styles.main}>
      {users.map((u) => (
        <Profile
          key={u.id}
          status={u.criminalRecordStatus}
          imgUrl={u.imgUrl !== "" ? u.imgUrl : defaultUserImg.src}
          name={`${u.firstName} ${u.lastName}`}
          id={u.id}
        />
      ))}
    </div>
  );
};

export default ProfilesList;
