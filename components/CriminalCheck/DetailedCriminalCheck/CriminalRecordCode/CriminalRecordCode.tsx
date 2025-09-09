import styles from "./criminalRecordCode.module.css";
import devImg from "../../../../assets/images/dev.svg";

type CriminalRecordCodeProps = {
  code: string;
};

const CriminalRecordCode = ({ code }: CriminalRecordCodeProps) => {
  return (
    <div className={styles.main}>
      <img src={devImg.src} alt="Code" />
      <span className={styles.title}>Criminal record code</span>
      <p className={styles.code}>{code}</p>
    </div>
  );
};

export default CriminalRecordCode;
