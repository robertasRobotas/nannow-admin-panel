import styles from "./detailedReport.module.css";
import { nunito } from "@/helpers/fonts";
import arrowImg from "../../../assets/images/arrow-right.svg";
import crossImg from "../../../assets/images/cross.svg";
import checkmarkImg from "../../../assets/images/checkmark-white.svg";
import avatarImg from "../../../assets/images/default-avatar.png";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { updateReportStatus } from "@/pages/api/fetch";
import arrowOut from "../../../assets/images/arrow-out.svg";
import { toast } from "react-toastify";
import { copyReport } from "@/helpers/clipboardWrites";
import attentionImg from "../../../assets/images/attention.svg";
import checkmarkGreenImg from "../../../assets/images/circle-checkmark-filled.svg";
import { Dispatch, SetStateAction, useState } from "react";

type DetailedReport = {
  report: ReportType;
  onBackClick?: () => void;
  reports: ReportType[];
  setReports: Dispatch<SetStateAction<ReportType[]>>;
};

const DetailedReport = ({
  report,
  reports,
  onBackClick,
  setReports,
}: DetailedReport) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [isSolved, setIsSolved] = useState(report?.isResolved);

  const onMarkSolved = async (isSolved: boolean) => {
    try {
      const response = await updateReportStatus(report.id, isSolved);
      if (response.status === 200) {
        toast("Successfully updated status");
        setReports(
          reports.map((r) => {
            if (r.id === report.id) {
              return { ...r, isResolved: !r.isResolved };
            } else return r;
          })
        );
        setIsSolved((prevState) => !prevState);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const onShare = async () => {
    copyReport(report.id);
    toast("Link to report copied!");
  };

  return (
    <div className={styles.main}>
      <span className={`${styles.sectionTitle} ${nunito.className}`}>
        Details
      </span>
      <div className={styles.status}>
        <span className={styles.statusTitle}>STATUS:</span>
        <img
          src={isSolved ? checkmarkGreenImg.src : attentionImg.src}
          className={styles.statusImg}
        />
        <span
          className={isSolved ? styles.solvedStatus : styles.reportedStatus}
        >
          {isSolved ? "SOLVED" : "REPORTED"}
        </span>
      </div>
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
                {`${report?.reportedUser?.firstName ?? "Deleted"}\n${
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
                {`${report?.reportedBy?.firstName ?? "Deleted"}\n${
                  report?.reportedBy?.lastName ?? "User"
                }`}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.btnsWrapper}>
          {!isSolved && (
            <Button
              title="Mark as solved"
              imgUrl={checkmarkImg.src}
              type="GREEN"
              onClick={() => onMarkSolved(true)}
            />
          )}
          {isSolved && (
            <Button
              title="Mark as not solved"
              imgUrl={crossImg.src}
              type="GRAY"
              onClick={() => onMarkSolved(false)}
            />
          )}

          <Button
            title="Share"
            imgUrl={arrowOut.src}
            type="OUTLINED"
            onClick={() => onShare()}
          />
          {isMobile && onBackClick && (
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
