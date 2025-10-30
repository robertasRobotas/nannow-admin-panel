import { User } from "@/types/Client";
import styles from "./cards.module.css";
import UserCard from "../UserCard/UserCard";

type CardsProps = {
  users: User[];
};

const Cards = ({ users }: CardsProps) => {
  return (
    <div className={styles.main}>
      {users.map((c) => (
        <UserCard key={c.id} user={c} />
      ))}
    </div>
  );
};

export default Cards;
