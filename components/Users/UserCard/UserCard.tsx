import styles from "./userCard.module.css";
import Link from "next/link";
import ProfileInfo from "../ProfileInfo/ProfileInfo";
import { useRef, type DragEvent, type MouseEvent } from "react";
import { UserWithCompensationDetails } from "../CompensationUsers/compensationPreview";
import CompensationRequestMiniCard from "../CompensationUsers/CompensationRequestMiniCard";

type UserCardProps = {
  user: UserWithCompensationDetails;
  mode: "client" | "provider";
  showCompensationInfo?: boolean;
};

const UserCard = ({ user, mode, showCompensationInfo }: UserCardProps) => {
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
          phoneNumber={user.client?.user?.phoneNumber}
          locale={user.locale}
          appVersion={user.appVersion}
          platform={user.platform}
          finalPrice={user.finalPrice}
          enableImageViewer={false}
        />
        {showCompensationInfo && <CompensationRequestMiniCard user={user} />}
      </div>
    </Link>
  );
};

export default UserCard;
