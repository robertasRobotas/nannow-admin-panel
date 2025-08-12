import styles from "./chat.module.css";
import verifiedBadgeImg from "../../../../../../assets/images/verified_badge.svg";
import crownImg from "../../../../../../assets/images/crown.svg";
import voiceChatImg from "../../../../../../assets/images/voice_chat.svg";

type ChatProps = {
  id: string;
  name: string;
  imgUrl: string;
  isVerified: boolean;
  isCrown: boolean;
  isVoicechat: boolean;
  message: string;
  onClick: () => void;
};

const Chat = ({
  id,
  name,
  imgUrl,
  isVerified,
  isCrown,
  isVoicechat,
  message,
  onClick,
}: ChatProps) => {
  return (
    <div className={styles.main}>
      <img className={styles.profileImg} src={imgUrl} alt="Icon" />
      <div className={styles.chatDetails}>
        <div className={styles.name}>
          <span>{name}</span>
          {isVerified && <img src={verifiedBadgeImg.src} alt="Verified" />}
          {isCrown && <img src={crownImg.src} alt="Crown" />}
          {isVoicechat && <img src={voiceChatImg.src} alt="Voice chat" />}
        </div>
        <div className={styles.lastMessage}>{message}</div>
      </div>
    </div>
  );
};

export default Chat;
