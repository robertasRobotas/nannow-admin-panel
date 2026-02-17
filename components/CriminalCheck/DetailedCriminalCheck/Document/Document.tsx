import styles from "./document.module.css";
import docImg from "../../../../assets/images/doc.svg";
import arrowOutImg from "../../../../assets/images/arrow-out.svg";
import Button from "@/components/Button/Button";

type DocumentProps = {
  documentUrl: string;
};

const Document = ({ documentUrl }: DocumentProps) => {
  const handleOpenDocument = () => {
    const openedWindow = window.open(documentUrl, "_blank", "noopener,noreferrer");
    if (openedWindow) return;

    // Popup blockers fallback.
    const a = document.createElement("a");
    a.href = documentUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={styles.main}>
      <div className={styles.docInfo}>
        <img src={docImg.src} alt="Document" />
        <span className={styles.title}>UPLOADED DOCUMENT</span>
        <span className={`${styles.fileName} ${styles.nunito}`}>
          {documentUrl.match(/[^\\/]+$/)}
        </span>
      </div>
      <Button
        title={"Open"}
        imgUrl={arrowOutImg.src}
        type="WHITE"
        onClick={() => handleOpenDocument()}
      />
    </div>
  );
};

export default Document;
