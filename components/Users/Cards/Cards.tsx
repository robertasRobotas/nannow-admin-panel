import { User } from "@/types/Client";
import styles from "./cards.module.css";
import UserCard from "../UserCard/UserCard";

type CardsProps = {
  users: User[];
  mode: "client" | "provider";
};

const Cards = ({ users, mode }: CardsProps) => {
  return (
    <div className={styles.main}>
      {users.map((c) => (
        <UserCard key={c.id} user={c} mode={mode} />
      ))}
    </div>
  );
};

export default Cards;
