import styles from "./criminalRecordCode.module.css";
import devImg from "../../../../assets/images/dev.svg";
import { getCriminalRecordInfo } from "@/pages/api/fetch";
import { useEffect, useState } from "react";

type CriminalRecordCodeProps = {
  code: string;
};

const CriminalRecordCode = ({ code }: CriminalRecordCodeProps) => {
  const [detailedInfo, setDetailedInfo] = useState();

  const fetchCriminalRecordInfo = async () => {
    try {
      const response = await getCriminalRecordInfo(code);
      setDetailedInfo(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchCriminalRecordInfo();
  }, []);

  console.log(detailedInfo);

  return (
    <div className={styles.main}>
      <img src={devImg.src} alt="Code" />
      <span className={styles.title}>Criminal record code</span>
      <p className={styles.code}>{code}</p>
    </div>
  );
};

export default CriminalRecordCode;
