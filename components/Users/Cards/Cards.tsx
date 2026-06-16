import styles from "./cards.module.css";
import UserCard from "../UserCard/UserCard";
import { UserWithCompensationDetails } from "../CompensationUsers/compensationPreview";

type CardsProps = {
  users: UserWithCompensationDetails[];
  mode: "client" | "provider";
  showCompensationInfo?: boolean;
};

const Cards = ({ users, mode, showCompensationInfo }: CardsProps) => {
  return (
    <div className={styles.main}>
      {users.map((c) => (
        <UserCard
          key={c.id}
          user={c}
          mode={mode}
          showCompensationInfo={showCompensationInfo}
        />
      ))}
    </div>
  );
};

export default Cards;
