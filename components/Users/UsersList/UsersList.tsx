import { User } from "@/types/Client";
import styles from "./usersList.module.css";
import defaultUserImg from "@/assets/images/default-avatar.png";
import { useRouter } from "next/router";
import { isRowNavExcluded } from "@/lib/utils";
import UserEmailIdLine from "../UserEmailIdLine/UserEmailIdLine";
import type { KeyboardEvent, MouseEvent } from "react";

type UsersListProps = {
  users: User[];
  mode: "client" | "provider";
};

const UsersList = ({ users, mode }: UsersListProps) => {
  const router = useRouter();

  return (
    <div className={styles.main}>
      {users.map((user) => {
        const displayName =
          `${user.firstName} ${user.lastName}`.trim() || "Unknown user";

        const openProfile = () => {
          const selectedText = window.getSelection?.()?.toString().trim() ?? "";
          if (selectedText.length > 0) return;
          router.push(`/${mode}/${user.userId}`);
        };

        const onRowClick = (e: MouseEvent<HTMLDivElement>) => {
          if (isRowNavExcluded(e.target)) return;
          openProfile();
        };

        const onRowKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          if (isRowNavExcluded(e.target)) return;
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          openProfile();
        };

        return (
          <div
            key={user.id}
            className={styles.row}
            tabIndex={0}
            onClick={onRowClick}
            onKeyDown={onRowKeyDown}
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
                <UserEmailIdLine email={user.email} userId={user.userId} />
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
          </div>
        );
      })}
    </div>
  );
};

export default UsersList;
