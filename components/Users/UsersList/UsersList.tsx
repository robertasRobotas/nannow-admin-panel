import { User } from "@/types/Client";
import styles from "./usersList.module.css";
import Button from "@/components/Button/Button";
import defaultUserImg from "@/assets/images/default-avatar.png";
import { useRouter } from "next/router";

type UsersListProps = {
  users: User[];
  mode: "client" | "provider";
};

const UsersList = ({ users, mode }: UsersListProps) => {
  const router = useRouter();

  return (
    <div className={styles.main}>
      {users.map((user) => (
        <div key={user.id} className={styles.row}>
          <div className={styles.left}>
            <img
              className={styles.avatar}
              src={user.imgUrl !== "" ? user.imgUrl : defaultUserImg.src}
              alt={`${user.firstName} ${user.lastName}`}
            />
            <div className={styles.info}>
              <div className={styles.name}>
                {`${user.firstName} ${user.lastName}`.trim() || "Unknown user"}
              </div>
              <div className={styles.meta}>{user.email || "—"}</div>
              <div className={styles.meta}>{`USER ID: ${user.userId}`}</div>
            </div>
          </div>
          <Button
            title="View"
            type="OUTLINED"
            onClick={() => router.push(`/${mode}/${user.userId}`)}
          />
        </div>
      ))}
    </div>
  );
};

export default UsersList;
