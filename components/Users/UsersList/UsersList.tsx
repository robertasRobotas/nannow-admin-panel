import styles from "./usersList.module.css";
import defaultUserImg from "@/assets/images/default-avatar.png";
import { useRouter } from "next/router";
import { isRowNavExcluded } from "@/lib/utils";
import UserEmailIdLine from "../UserEmailIdLine/UserEmailIdLine";
import { useRef, type MouseEvent } from "react";
import { UserWithCompensationDetails } from "../CompensationUsers/compensationPreview";
import CompensationRequestMiniCard from "../CompensationUsers/CompensationRequestMiniCard";

type UsersListProps = {
  users: UserWithCompensationDetails[];
  mode: "client" | "provider";
  showCompensationInfo?: boolean;
};

const UsersList = ({ users, mode, showCompensationInfo }: UsersListProps) => {
  const router = useRouter();
  const hasSelectionRef = useRef(false);

  const updateSelectionState = () => {
    hasSelectionRef.current =
      (window.getSelection?.()?.toString().trim() ?? "").length > 0;
  };

  return (
    <div className={styles.main}>
      {users.map((user) => {
        const displayName =
          `${user.firstName} ${user.lastName}`.trim() || "Unknown user";
        const href = `/${mode}/${user.userId}`;

        const onRowClick = (e: MouseEvent<HTMLDivElement>) => {
          if (isRowNavExcluded(e.target)) {
            return;
          }
          updateSelectionState();
          if (hasSelectionRef.current) {
            return;
          }
          void router.push(href);
        };

        return (
          <div
            key={user.id}
            className={styles.row}
            onClick={onRowClick}
            onMouseUp={updateSelectionState}
            role="link"
            tabIndex={0}
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
                <CompensationRequestMiniCard user={user} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UsersList;
