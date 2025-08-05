import { Client } from "@/types/Client";
import styles from "./clientCard.module.css";
import { nunito } from "@/helpers/fonts";
import balanceImg from "../../../assets/images/wallet.svg";

type ClientCardProps = {
  client: Client;
};

const ClientCard = ({ client }: ClientCardProps) => {
  return (
    <div className={styles.main}>
      <div className={styles.profileImgWrapper}>
        <img
          className={styles.profileImg}
          src={client.profileimg}
          alt="Profile Image"
        />
      </div>
      <span className={`${styles.name} ${nunito.className}`}>
        {client.name}
      </span>
      <span className={styles.id}>{`ID: ${client.id}`}</span>
      <div className={styles.balance}>
        <img src={balanceImg.src} alt="Balance" />
        <span>{`€ ${client.balance}`}</span>
      </div>
    </div>
  );
};

export default ClientCard;
