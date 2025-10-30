import { User } from "@/types/Client";
import styles from "./userCard.module.css";
import Button from "@/components/Button/Button";
import { useRouter } from "next/router";
import ProfileInfo from "../ProfileInfo/ProfileInfo";
import defaultUserImg from "../../../assets/images/default-avatar.png";

type ClientCardProps = {
  user: User;
};

const UserCard = ({ user }: ClientCardProps) => {
  const router = useRouter();

  const onButtonClick = () => {
    router.push(`/users/${user.userId}`);
  };

  return (
    <div className={styles.main}>
      <div className={styles.profileWrapper}>
        <ProfileInfo
          name={`${user.firstName} ${user.lastName}`}
          imgUrl={user.imgUrl !== "" ? user.imgUrl : defaultUserImg.src}
          id={user.userId}
        />
      </div>
      <Button onClick={onButtonClick} title="View profile" type="OUTLINED" />
    </div>
  );
};

export default UserCard;
