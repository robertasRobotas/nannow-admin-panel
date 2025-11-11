/* eslint-disable @next/next/no-img-element */
import { getButtonsData } from "@/data/userProfileMenu";
import styles from "./profileMenuButtons.module.css";
import { UserDetails } from "@/types/Client";
import { Dispatch, SetStateAction } from "react";

type ProfileMenuButtonsProps = {
  user: UserDetails;
  setIsSelectedMenu: () => void;
  selectedSection: string;
  setSelectedSection: Dispatch<SetStateAction<string>>;
  mode: "client" | "provider";
};

const ProfileMenuButtons = ({
  user,
  setIsSelectedMenu,
  selectedSection,
  setSelectedSection,
  mode,
}: ProfileMenuButtonsProps) => {
  const buttonsData = getButtonsData(user, mode);

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
