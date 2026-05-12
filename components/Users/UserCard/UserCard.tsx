import { User } from "@/types/Client";
import styles from "./userCard.module.css";
import Link from "next/link";
import ProfileInfo from "../ProfileInfo/ProfileInfo";
import { useRef, type DragEvent, type MouseEvent } from "react";

type UserCardProps = {
  user: User;
  mode: "client" | "provider";
};

const UserCard = ({ user, mode }: UserCardProps) => {
  const href = `/${mode}/${user.userId}`;
  const hasSelectionRef = useRef(false);

  const updateSelectionState = () => {
    hasSelectionRef.current =
      (window.getSelection?.()?.toString().trim() ?? "").length > 0;
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    updateSelectionState();
    if (hasSelectionRef.current) {
      event.preventDefault();
    }
  };

  const preventLinkDrag = (event: DragEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  };

  return (
    <Link
      href={href}
      className={styles.main}
      onClick={handleClick}
      onMouseUp={updateSelectionState}
      onDragStart={preventLinkDrag}
      draggable={false}
      aria-label={`View ${`${user.firstName} ${user.lastName}`.trim() || "user"} profile`}
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
    </Link>
  );
};

export default UserCard;
