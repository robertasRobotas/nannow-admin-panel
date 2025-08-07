import { getButtonsData } from "@/data/clientProfileMenu";
import styles from "./profileMenu.module.css";
import { Client } from "@/types/Client";

type ProfileMenuProps = {
  client: Client;
};

const ProfileMenu = ({ client }: ProfileMenuProps) => {
  const buttonsData = getButtonsData(client);

  return (
    <div className={styles.main}>
      {buttonsData.map((b, i) => (
        <button key={i} className={styles.menuButton}>
          <img src={b.img.src} alt="Icon" />
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
