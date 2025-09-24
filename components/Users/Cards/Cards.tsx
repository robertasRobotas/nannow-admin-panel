import { Client } from "@/types/Client";
import ClientCard from "../ClientCard/ClientCard";
import styles from "./cards.module.css";

type CardsProps = {
  users: Client[];
};

const Cards = ({ users }: CardsProps) => {
  return (
    <div className={styles.main}>
      {users.map((c) => (
        <ClientCard key={c.id} client={c} />
      ))}
    </div>
  );
};

export default Cards;
