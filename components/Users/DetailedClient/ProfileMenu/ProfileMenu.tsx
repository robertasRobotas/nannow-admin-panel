import Button from "@/components/Button/Button";
import ProfileInfo from "../../ProfileInfo/ProfileInfo";
import ProfileMenuButtons from "../ProfileMenuButtons/ProfileMenuButtons";
import styles from "./profileMenu.module.css";
import trashImg from "../../../../assets/images/trash.svg";
import balanceImg from "../../../../assets/images/wallet.svg";
import { UserDetails } from "@/types/Client";
import { Dispatch, SetStateAction } from "react";
import avatarImg from "../../../../assets/images/default-avatar.png";

type ProfileMenuProps = {
  user: UserDetails;
  selectedSection: string;
  setIsSelectedMenu: () => void;
  setSelectedSection: Dispatch<SetStateAction<string>>;
};

const ProfileMenu = ({
  user,
  setIsSelectedMenu,
  selectedSection,
  setSelectedSection,
}: ProfileMenuProps) => {
  return (
    <div className={styles.aside}>
      <div className={styles.profileWrapper}>
        <ProfileInfo
          name={`${user.user.firstName} ${user.user.lastName}`}
          imgUrl={
            user.user.imgUrl.length > 0 ? user.user.imgUrl : avatarImg.src
          }
          id={user.user.id}
        />
        <div className={styles.balance}>
          <img src={balanceImg.src} alt="Balance" />
          <span>€ 0</span>
        </div>
      </div>
      <ProfileMenuButtons
        setIsSelectedMenu={setIsSelectedMenu}
        client={user}
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
