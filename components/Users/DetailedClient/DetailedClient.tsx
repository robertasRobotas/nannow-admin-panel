/* eslint-disable @next/next/no-img-element */
import { Client } from "@/types/Client";
import styles from "./detailedClient.module.css";
import { nunito } from "@/helpers/fonts";
import balanceImg from "../../../assets/images/wallet.svg";
import ProfileMenu from "./ProfileMenu/ProfileMenu";
import Button from "@/components/Button/Button";
import trashImg from "../../../assets/images/trash.svg";
import { useState } from "react";

type DetailedClientProps = {
  client: Client;
};

const DetailedClient = ({ client }: DetailedClientProps) => {
  const [selectedSection, setSelectedSection] = useState("general");

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
        <ProfileMenu
          client={client}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
        />
        <Button
          title="Delete profile"
          imgUrl={trashImg.src}
          type="OUTLINED"
          onClick={() => console.log("wip")}
        />
      </div>
    </div>
  );
};

export default DetailedClient;
