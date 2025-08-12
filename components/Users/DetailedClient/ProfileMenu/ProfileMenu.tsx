import Button from "@/components/Button/Button";
import ProfileInfo from "../../ProfileInfo/ProfileInfo";
import ProfileMenuButtons from "../ProfileMenuButtons/ProfileMenuButtons";
import styles from "./profileMenu.module.css";
import trashImg from "../../../../assets/images/trash.svg";
import balanceImg from "../../../../assets/images/wallet.svg";
import { ClientDetails } from "@/types/Client";
import { Dispatch, SetStateAction } from "react";

type ProfileMenuProps = {
  client: ClientDetails;
  selectedSection: string;
  setIsSelectedMenu: () => void;
  setSelectedSection: Dispatch<SetStateAction<string>>;
};

const ProfileMenu = ({
  client,
  setIsSelectedMenu,
  selectedSection,
  setSelectedSection,
}: ProfileMenuProps) => {
  return (
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
      <ProfileMenuButtons
        setIsSelectedMenu={setIsSelectedMenu}
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
  );
};

export default ProfileMenu;
