/* eslint-disable @next/next/no-img-element */
import { getButtonsData } from "@/data/clientProfileMenu";
import styles from "./profileMenu.module.css";
import { Client } from "@/types/Client";
import { Dispatch, SetStateAction } from "react";

type ProfileMenuProps = {
  client: Client;
  selectedSection: string;
  setSelectedSection: Dispatch<SetStateAction<string>>;
};

const ProfileMenu = ({
  client,
  selectedSection,
  setSelectedSection,
}: ProfileMenuProps) => {
  const buttonsData = getButtonsData(client);

  return (
    <div className={styles.main}>
      {buttonsData.map((b, i) => (
        <button
          onClick={() => setSelectedSection(b.id)}
          key={i}
          className={`${styles.menuButton} ${
            selectedSection === b.id && styles.active
          }`}
        >
          <b.icon />
          <span>
            {b.title}
            {b.number && ` (${b.number})`}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ProfileMenu;
