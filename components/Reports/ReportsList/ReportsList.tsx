import Report from "./Report/Report";
import styles from "./reportsList.module.css";
import { nunito } from "@/helpers/fonts";
import warningImg from "../../../assets/images/attention.svg";
import flashImg from "../../../assets/images/flash-filled.svg";
import checkMarkImg from "../../../assets/images/green-checkmark.svg";
import { Dispatch, SetStateAction } from "react";

type ReportsListProps = {
  reports: any;
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
          const icon = r.isSolved
            ? checkMarkImg.src
            : r.isInvestigating
            ? flashImg.src
            : warningImg.src;
          return (
            <Report
              key={r.id}
              icon={icon}
              reportedByImg={r.reported_by.imgUrl}
              reportedByName={r.reported_by.name.split(" ")[0]}
              reportedImg={r.reported.imgUrl}
              reportedName={r.reported.name.split(" ")[0]}
              date={r.createdAt}
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
