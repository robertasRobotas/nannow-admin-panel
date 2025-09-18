import styles from "./document.module.css";
import docImg from "../../../../assets/images/doc.svg";
import downloadImg from "../../../../assets/images/download.svg";
import Button from "@/components/Button/Button";

type DocumentProps = {
  documentUrl: string;
};

const Document = ({ documentUrl }: DocumentProps) => {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = documentUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={styles.main}>
      <div className={styles.docInfo}>
        <img src={docImg.src} />
        <span className={styles.title}>UPLOADED DOCUMENT</span>
        <span className={`${styles.fileName} ${styles.nunito}`}>
          {documentUrl.match(/[^\\/]+$/)}
        </span>
      </div>
      <Button
        title={"Download"}
        imgUrl={downloadImg.src}
        type="WHITE"
        onClick={() => handleDownload()}
      />
    </div>
  );
};

export default Document;
