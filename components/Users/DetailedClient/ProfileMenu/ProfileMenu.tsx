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
  mode: "client" | "provider";
};

const ProfileMenu = ({
  user,
  setIsSelectedMenu,
  selectedSection,
  setSelectedSection,
  mode,
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
          mode={mode}
        />
        <div className={styles.balance}>
          <img src={balanceImg.src} alt="Balance" />
          <span>€ not working yet</span>
        </div>
      </div>
      <ProfileMenuButtons
        setIsSelectedMenu={setIsSelectedMenu}
        user={user}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        mode={mode}
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
