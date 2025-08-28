import styles from "./criminalRecordComment.module.css";
import warningImg from "../../../../assets/images/attention_outlined.svg";

const CriminalRecordComment = () => {
  return (
    <div className={styles.main}>
      <img src={warningImg.src} alt="Warning" />
      <span className={styles.title}>Criminal record status comment</span>
    </div>
  );
};

export default CriminalRecordComment;
