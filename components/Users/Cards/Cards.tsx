import ClientCard from "../ClientCard/ClientCard";
import styles from "./cards.module.css";
import { clients } from "@/mocks/clients";

const Cards = () => {
  return (
    <div className={styles.main}>
      {clients.map((c) => (
        <ClientCard key={c.id} client={c} />
      ))}
    </div>
  );
};

export default Cards;
