import styles from "./verifiedType.module.css";
import badgeImg from "../../../../assets/images/badge.svg";
import docImg from "../../../../assets/images/doc.svg";
import devImg from "../../../../assets/images/dev.svg";
import { nunito } from "@/helpers/fonts";

type VerifiedTypeProps = {
  verifiedType: string;
};

const VerifiedType = ({ verifiedType }: VerifiedTypeProps) => {
  return (
    <div className={styles.verifiedType}>
      <img src={badgeImg.src} alt="Badge" />
      <div className={styles.verifiedInfo}>
        <span className={styles.title}>CRIMINAL RECORD VERIFIED TYPE</span>
        <div className={styles.docType}>
          {verifiedType === "DOCUMENT" ? (
            <img className={styles.docIcon} src={docImg.src} alt="Doc" />
          ) : (
            verifiedType === "QR" && (
              <img className={styles.docIcon} src={devImg.src} alt="QR" />
            )
          )}
          <span className={`${styles.docTitle} ${nunito.className}`}>
            {verifiedType === "DOCUMENT"
              ? "Document"
              : verifiedType === "QR"
              ? "QR"
              : "-"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerifiedType;
