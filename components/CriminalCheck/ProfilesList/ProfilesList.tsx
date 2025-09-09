import { CriminalCheckUser } from "@/types/CriminalCheckUser";
import styles from "./profilesList.module.css";
import Profile from "./Profile/Profile";

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
          imgUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/640px-User_icon_2.svg.png"
          name={`${u.firstName} ${u.lastName}`}
          id={u.id}
        />
      ))}
    </div>
  );
};

export default ProfilesList;
