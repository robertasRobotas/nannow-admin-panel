/* eslint-disable @next/next/no-img-element */
import { ClientDetails } from "@/types/Client";
import styles from "./detailedClient.module.css";
import balanceImg from "../../../assets/images/wallet.svg";
import ProfileMenu from "./ProfileMenu/ProfileMenu";
import Button from "@/components/Button/Button";
import trashImg from "../../../assets/images/trash.svg";
import { useState } from "react";
import ProfileInfo from "../ProfileInfo/ProfileInfo";
import GeneralSection from "./GeneralSection/GeneralSection";

type DetailedClientProps = {
  client: ClientDetails;
};

const DetailedClient = ({ client }: DetailedClientProps) => {
  const [selectedSection, setSelectedSection] = useState("general");

  const renderSelectedMenu = () => {
    switch (selectedSection) {
      case "general": {
        return <GeneralSection client={client} />;
      }
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.aside}>
        <div className={styles.profileWrapper}>
          <ProfileInfo
            name={`${client.user.firstName} ${client.user.lastName}`}
            imgUrl={client.user.imgUrl}
            id={client.client.id}
          />
          <div className={styles.balance}>
            <img src={balanceImg.src} alt="Balance" />
            {/*<span>{`€ ${client.balance.toFixed(2)}`}</span>*/}
            <span>€ 0</span>
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
      <div className={styles.sectionWrapper}>{renderSelectedMenu()}</div>
    </div>
  );
};

export default DetailedClient;
