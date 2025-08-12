/* eslint-disable @next/next/no-img-element */
import { getButtonsData } from "@/data/clientProfileMenu";
import styles from "./profileMenuButtons.module.css";
import { Client, ClientDetails } from "@/types/Client";
import { Dispatch, SetStateAction } from "react";

type ProfileMenuButtonsProps = {
  client: ClientDetails;
  setIsSelectedMenu: () => void;
  selectedSection: string;
  setSelectedSection: Dispatch<SetStateAction<string>>;
};

const ProfileMenuButtons = ({
  client,
  setIsSelectedMenu,
  selectedSection,
  setSelectedSection,
}: ProfileMenuButtonsProps) => {
  const buttonsData = getButtonsData(client);

  return (
    <div className={styles.main}>
      {buttonsData.map((b, i) => (
        <button
          onClick={() => {
            setIsSelectedMenu();
            setSelectedSection(b.id);
          }}
          key={i}
          className={`${styles.menuButton} ${
            selectedSection === b.id && styles.active
          }`}
        >
          <b.icon />
          <span>
            {b.title}{" "}
            {b.number !== undefined && ` (${b.number}${i === 6 ? "/4" : ""})`}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ProfileMenuButtons;
