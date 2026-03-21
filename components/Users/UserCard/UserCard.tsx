import { User } from "@/types/Client";
import styles from "./userCard.module.css";
import { useRouter } from "next/router";
import ProfileInfo from "../ProfileInfo/ProfileInfo";
import defaultUserImg from "../../../assets/images/default-avatar.png";
import { type KeyboardEvent } from "react";

type UserCardProps = {
  user: User;
  mode: "client" | "provider";
};

const UserCard = ({ user, mode }: UserCardProps) => {
  const router = useRouter();

  const openProfile = () => {
    router.push(`/${mode}/${user.userId}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProfile();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.main}
      onClick={openProfile}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.profileWrapper}>
        <ProfileInfo
          name={`${user.firstName} ${user.lastName}`}
          imgUrl={user.imgUrl !== "" ? user.imgUrl : defaultUserImg.src}
          id={user.userId}
          email={user.email}
        />
      </div>
    </div>
  );
};

export default UserCard;
