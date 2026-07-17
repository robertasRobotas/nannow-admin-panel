import styles from "./userCard.module.css";
import { useRouter } from "next/router";
import ProfileInfo from "../ProfileInfo/ProfileInfo";
import { useRef, type MouseEvent } from "react";
import { isRowNavExcluded } from "@/lib/utils";
import { UserWithCompensationDetails } from "../CompensationUsers/compensationPreview";
import CompensationRequestMiniCard from "../CompensationUsers/CompensationRequestMiniCard";

type UserCardProps = {
  user: UserWithCompensationDetails;
  mode: "client" | "provider";
  showCompensationInfo?: boolean;
};

const UserCard = ({ user, mode, showCompensationInfo }: UserCardProps) => {
  const router = useRouter();
  const href = `/${mode}/${user.userId}`;
  const hasSelectionRef = useRef(false);

  const updateSelectionState = () => {
    hasSelectionRef.current =
      (window.getSelection?.()?.toString().trim() ?? "").length > 0;
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (isRowNavExcluded(event.target)) return;
    updateSelectionState();
    if (hasSelectionRef.current) {
      return;
    }
    void router.push(href);
  };

  return (
    <div
      className={styles.main}
      onClick={handleClick}
      onMouseUp={updateSelectionState}
      role="link"
      tabIndex={0}
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
    </div>
  );
};

export default UserCard;
