import { Client } from "@/types/Client";
import styles from "./clientCard.module.css";
import { nunito } from "@/helpers/fonts";
import balanceImg from "../../../assets/images/wallet.svg";
import Button from "@/components/Button/Button";
import { getClientStats } from "@/data/clientStats";
import { useRouter } from "next/router";

type ClientCardProps = {
  client: Client;
};

const ClientCard = ({ client }: ClientCardProps) => {
  const stats = getClientStats(client);
  const router = useRouter();

  const onButtonClick = () => {
    router.push(`/users/${client.userId}`);
  };

  return (
    <div className={styles.main}>
      <div className={styles.profileWrapper}>
        <div className={styles.infoWrapper}>
          <img
            className={styles.profileImg}
            src={client.imgUrl}
            alt="Profile Image"
          />
          <span className={`${styles.name} ${nunito.className}`}>
            {client.firstName} {client.lastName}
          </span>
          <span className={styles.id}>{`ID: ${client.id}`}</span>
        </div>
        <div className={styles.statsWrapper}>
          <div className={styles.balance}>
            <img src={balanceImg.src} alt="Balance" />
            {/*<span>{`€ ${client.balance.toFixed(2)}`}</span>*/}
            <span>€ 0</span>
          </div>
          <div className={styles.stats}>
            {stats.map((s) => (
              <div key={s.key} className={styles.stat}>
                <s.icon />
                {/*<span>{s.value}</span>*/}0
              </div>
            ))}
          </div>
        </div>
      </div>
      <Button onClick={onButtonClick} title="View profile" type="OUTLINED" />
    </div>
  );
};

export default ClientCard;
