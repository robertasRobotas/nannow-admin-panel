import styles from "./detailedReport.module.css";
import { nunito } from "@/helpers/fonts";
import arrowImg from "../../../assets/images/arrow-right.svg";
import flashImg from "../../../assets/images/flash-white.svg";
import crossImg from "../../../assets/images/cross.svg";
import checkmarkImg from "../../../assets/images/checkmark-white.svg";
import avatarImg from "../../../assets/images/default-avatar.png";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { updateReportStatus } from "@/pages/api/fetch";

type DetailedReport = {
  report: ReportType;
  onBackClick: () => void;
};

const DetailedReport = ({ report, onBackClick }: DetailedReport) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  const onMarkSolved = async (isSolved: boolean) => {
    try {
      const response = await updateReportStatus(report.id, isSolved);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className={styles.main}>
      <span className={`${styles.sectionTitle} ${nunito.className}`}>
        Details
      </span>
      <div className={styles.heading}>
        <div className={styles.reportDetails}>
          <div className={styles.profile}>
            <img
              src={report?.reportedUser?.imgUrl ?? avatarImg.src}
              alt="Profile"
            />
            <div>
              <span className={styles.title}>Has been reported</span>
              <span className={styles.name}>
                {`${report?.reportedUser?.firstName ?? "Deleted"} ${
                  report?.reportedUser?.lastName ?? "User"
                }`}
              </span>
            </div>
          </div>
          <img src={arrowImg.src} alt="Arrow" />
          <div className={styles.profile}>
            <img
              src={report?.reportedBy?.imgUrl ?? avatarImg.src}
              alt="Profile"
            />
            <div>
              <span className={styles.title}>Reported by</span>
              <span className={styles.name}>
                {`${report?.reportedBy?.firstName ?? "Deleted"} ${
                  report?.reportedBy?.lastName ?? "User"
                }`}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.btnsWrapper}>
          <Button
            title="Mark as solved"
            imgUrl={checkmarkImg.src}
            type="GREEN"
            onClick={() => onMarkSolved(true)}
          />
          <Button
            title="Mark as not solved"
            imgUrl={crossImg.src}
            type="GRAY"
            onClick={() => onMarkSolved(false)}
          />
          {isMobile && (
            <Button title="Back" type="OUTLINED" onClick={onBackClick} />
          )}
        </div>
      </div>
      <div className={styles.review}>
        <img src={report?.reportedBy?.imgUrl ?? avatarImg.src} alt="Profile" />
        <div className={styles.reviewBubble}>{report.reportMessage}</div>
      </div>
    </div>
  );
};

export default DetailedReport;
