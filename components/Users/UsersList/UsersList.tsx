import styles from "./usersList.module.css";
import defaultUserImg from "@/assets/images/default-avatar.png";
import Link from "next/link";
import { isRowNavExcluded } from "@/lib/utils";
import UserEmailIdLine from "../UserEmailIdLine/UserEmailIdLine";
import { useRef, type DragEvent, type MouseEvent } from "react";
import { UserWithCompensationDetails } from "../CompensationUsers/compensationPreview";
import CompensationRequestMiniCard from "../CompensationUsers/CompensationRequestMiniCard";

type UsersListProps = {
  users: UserWithCompensationDetails[];
  mode: "client" | "provider";
  showCompensationInfo?: boolean;
  onCompensationRequestUpdated?: () => void;
};

const UsersList = ({
  users,
  mode,
  showCompensationInfo,
  onCompensationRequestUpdated,
}: UsersListProps) => {
  const hasSelectionRef = useRef(false);

  const updateSelectionState = () => {
    hasSelectionRef.current =
      (window.getSelection?.()?.toString().trim() ?? "").length > 0;
  };

  const preventLinkDrag = (event: DragEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  };

  return (
    <div className={styles.main}>
      {users.map((user) => {
        const displayName =
          `${user.firstName} ${user.lastName}`.trim() || "Unknown user";
        const href = `/${mode}/${user.userId}`;

        const onRowClick = (e: MouseEvent<HTMLAnchorElement>) => {
          if (isRowNavExcluded(e.target)) {
            e.preventDefault();
            return;
          }
          updateSelectionState();
          if (hasSelectionRef.current) {
            e.preventDefault();
          }
        };

        return (
          <Link
            key={user.id}
            href={href}
            className={styles.row}
            onClick={onRowClick}
            onMouseUp={updateSelectionState}
            onDragStart={preventLinkDrag}
            draggable={false}
            aria-label={`View ${displayName} profile`}
          >
            <div className={styles.left}>
              <img
                className={styles.avatar}
                src={user.imgUrl !== "" ? user.imgUrl : defaultUserImg.src}
                alt=""
              />
              <div className={styles.info}>
                <div className={styles.name}>{displayName}</div>
                <UserEmailIdLine
                  email={user.email}
                  userId={user.userId}
                  phoneNumber={user.client?.user?.phoneNumber}
                />
                <div
                  className={styles.meta}
                >{`APP INFO: ${user.platform ?? "—"} | ${user.appVersion ?? "—"}`}</div>
                {mode === "provider" && (
                  <div
                    className={styles.meta}
                  >{`Final price: ${user.finalPrice}`}</div>
                )}
              </div>
            </div>
            {showCompensationInfo && (
              <div className={styles.compensationMeta}>
                <CompensationRequestMiniCard
                  user={user}
                  onUpdated={onCompensationRequestUpdated}
                />
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default UsersList;
