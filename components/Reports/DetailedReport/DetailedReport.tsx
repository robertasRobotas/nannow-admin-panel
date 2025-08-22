import styles from "./detailedReport.module.css";
import { nunito } from "@/helpers/fonts";
import arrowImg from "../../../assets/images/arrow-right.svg";
import flashImg from "../../../assets/images/flash-white.svg";
import checkmarkImg from "../../../assets/images/checkmark-white.svg";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";

type DetailedReport = {
  report: any;
  onBackClick: () => void;
};

const DetailedReport = ({ report, onBackClick }: DetailedReport) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  return (
    <div className={styles.main}>
      <span className={`${styles.sectionTitle} ${nunito.className}`}>
        Details
      </span>
      <div className={styles.heading}>
        <div className={styles.reportDetails}>
          <div className={styles.profile}>
            <img src={report.reported_by.imgUrl} alt="Profile" />
            <div>
              <span className={styles.title}>Has been reported</span>
              <span className={styles.name}>
                {report.reported.name.split(" ")[0]}
              </span>
            </div>
          </div>
          <img src={arrowImg.src} alt="Arrow" />
          <div className={styles.profile}>
            <img src={report.reported.imgUrl} alt="Profile" />
            <div>
              <span className={styles.title}>Reported by</span>
              <span className={styles.name}>
                {report.reported_by.name.split(" ")[0]}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.btnsWrapper}>
          <Button
            title="Start investigation"
            imgUrl={flashImg.src}
            type="BLACK"
          />
          <Button
            title="Mark as solved"
            imgUrl={checkmarkImg.src}
            type="GREEN"
          />
          {isMobile && (
            <Button title="Back" type="OUTLINED" onClick={onBackClick} />
          )}
        </div>
      </div>
      <div className={styles.review}>
        <img src={report.reported_by.imgUrl} alt="Profile" />
        <div className={styles.reviewBubble}>{report.report}</div>
      </div>
    </div>
  );
};

export default DetailedReport;
