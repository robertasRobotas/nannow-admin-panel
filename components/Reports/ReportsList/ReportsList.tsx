import Report from "./Report/Report";
import styles from "./reportsList.module.css";
import { nunito } from "@/helpers/fonts";
import warningImg from "../../../assets/images/attention.svg";
import avatarImg from "../../../assets/images/default-avatar.png";
import flashImg from "../../../assets/images/flash-filled.svg";
import checkMarkImg from "../../../assets/images/green-checkmark.svg";
import { Dispatch, SetStateAction } from "react";

type ReportsListProps = {
  reports: ReportType[];
  selectedReportId: string;
  setSelectedReportId: Dispatch<SetStateAction<string>>;
};

const ReportsList = ({
  reports,
  selectedReportId,
  setSelectedReportId,
}: ReportsListProps) => {
  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>Reported</div>
      <div>
        {reports.map((r) => {
          const icon = r.isResolved ? checkMarkImg.src : warningImg.src;
          return (
            <Report
              key={r.id}
              icon={icon}
              reportedByImg={r?.reportedBy?.imgUrl ?? avatarImg.src}
              reportedByName={`${r?.reportedBy?.firstName ?? "Deleted"} ${
                r?.reportedBy?.lastName ?? "User"
              }`}
              reportedImg={r?.reportedUser?.imgUrl ?? avatarImg.src}
              reportedName={`${r?.reportedUser?.firstName ?? "Deleted"} ${
                r?.reportedUser?.lastName ?? "User"
              }`}
              date={r?.createdAt}
              isSelected={selectedReportId === r.id}
              onClick={() => setSelectedReportId(r.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ReportsList;
