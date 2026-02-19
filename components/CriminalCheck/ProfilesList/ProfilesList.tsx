import { CriminalCheckUser } from "@/types/CriminalCheckUser";
import styles from "./profilesList.module.css";
import Profile from "./Profile/Profile";
import defaultUserImg from "../../../assets/images/default-avatar.png";

type ProfilesListProps = {
  users: CriminalCheckUser[];
};

const ProfilesList = ({ users }: ProfilesListProps) => {
  const resolveStatus = (
    user: CriminalCheckUser,
  ): "APPROVED" | "REJECTED" | "PENDING" | "NOT_SUBMITTED" => {
    const newStatus = user?.provider?.criminalRecord?.currentStatus;
    const applications = user?.provider?.criminalRecord?.applications;
    const hasNewFields =
      typeof newStatus === "string" || Array.isArray(applications);
    const hasApplications = Array.isArray(applications) && applications.length > 0;

    if (hasNewFields && hasApplications && newStatus) {
      return newStatus;
    }

    if (user?.criminalRecordStatus) {
      return user.criminalRecordStatus;
    }

    if (newStatus) {
      return newStatus;
    }

    return "NOT_SUBMITTED";
  };

  return (
    <div className={styles.main}>
      {users.map((u) => (
        <Profile
          key={u.id}
          status={resolveStatus(u)}
          imgUrl={u.imgUrl !== "" ? u.imgUrl : defaultUserImg.src}
          name={`${u.firstName} ${u.lastName}`}
          id={u.id}
        />
      ))}
    </div>
  );
};

export default ProfilesList;
