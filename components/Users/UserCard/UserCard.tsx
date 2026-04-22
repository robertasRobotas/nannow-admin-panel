import { User } from "@/types/Client";
import styles from "./userCard.module.css";
import { useRouter } from "next/router";
import ProfileInfo from "../ProfileInfo/ProfileInfo";
import { type KeyboardEvent } from "react";

type UserCardProps = {
  user: User;
  mode: "client" | "provider";
};

const UserCard = ({ user, mode }: UserCardProps) => {
  const router = useRouter();

  const openProfile = () => {
    const selectedText = window.getSelection?.()?.toString().trim() ?? "";
    if (selectedText.length > 0) return;
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
          mode={mode}
          showRoleSuffix={false}
          imgUrl={user.imgUrl}
          id={user.userId}
          email={user.email}
          locale={user.locale}
          appVersion={user.appVersion}
          platform={user.platform}
          finalPrice={user.finalPrice}
          enableImageViewer={false}
        />
      </div>
    </div>
  );
};

export default UserCard;
