import { Client } from "@/types/Client";
import styles from "./detailedClient.module.css";
import { nunito } from "@/helpers/fonts";
import balanceImg from "../../../assets/images/wallet.svg";
import ProfileMenu from "./ProfileMenu/ProfileMenu";

type DetailedClientProps = {
  client: Client;
};

const DetailedClient = ({ client }: DetailedClientProps) => {
  return (
    <div className={styles.main}>
      <div className={styles.aside}>
        <div className={styles.profileWrapper}>
          <div className={styles.profileInfo}>
            <img
              className={styles.profileImg}
              src={client.profileimg}
              alt="Profile Image"
            />
            <span className={`${styles.name} ${nunito.className}`}>
              {client.name}
            </span>
            <span className={styles.id}>{`ID: ${client.id}`}</span>
          </div>
          <div className={styles.balance}>
            <img src={balanceImg.src} alt="Balance" />
            <span>{`€ ${client.balance.toFixed(2)}`}</span>
          </div>
        </div>
        <ProfileMenu client={client} />
      </div>
    </div>
  );
};

export default DetailedClient;
