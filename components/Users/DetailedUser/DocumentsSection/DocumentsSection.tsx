/* eslint-disable @next/next/no-img-element */
import styles from "./documentsSection.module.css";
import Button from "@/components/Button/Button";
import fileImg from "../../../../assets/images/download.svg";
import arrowOutImg from "../../../../assets/images/arrow-out.svg";
import downloadImg from "../../../../assets/images/download.svg";
import { useEffect, useState } from "react";
import { toggleDocumentReviewed } from "@/pages/api/fetch";

type DocumentsSectionProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: any[];
  onBackClick: () => void;
};

const isImageUrl = (url: string) =>
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url?.split("?")[0] ?? url);

const getFileName = (url: string) => {
  const m = url?.match(/[^\\/]+$/);
  return m ? m[0] : url;
};

const formatDate = (iso?: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso ?? "";
  }
};

const appendS3DownloadParam = (url: string, filename: string) => {
  const hasQuery = url.includes("?");
  const encoded = encodeURIComponent(`attachment; filename="${filename}"`);
  return `${url}${hasQuery ? "&" : "?"}response-content-disposition=${encoded}`;
};

const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!response.ok) {
      throw new Error("Failed to fetch file");
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Fallback: ask S3/CDN to force attachment and open in new tab
    const forced = appendS3DownloadParam(url, filename);
    window.open(forced, "_blank", "noopener,noreferrer");
  }
};

const DocumentsSection = ({
  documents,
  onBackClick,
}: DocumentsSectionProps) => {
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const initial = new Set<string>();
    documents?.forEach((d) => {
      if (
        d?.isReviewed ||
        d?.reviewed ||
        d?.reviewedAt ||
        d?.adminReviewedAt ||
        d?.reviewedAt
      ) {
        initial.add(d.id);
      }
    });
    setReviewedIds(initial);
  }, [documents]);

  console.log(documents);

  return (
    <div className={styles.main}>
      <h3 className={styles.title}>Documents</h3>
      <div className={styles.grid}>
        {documents?.length ? (
          documents.map((doc) => {
            const showThumb = isImageUrl(doc.documentUrl);
            const fileName = getFileName(doc.documentUrl);
            return (
              <div className={styles.card} key={doc.id}>
                <div className={styles.docTop}>
                  {showThumb ? (
                    <img
                      className={styles.thumb}
                      src={doc.documentUrl}
                      alt={doc.title ?? "Document"}
                      onClick={() =>
                        window.open(
                          doc.documentUrl,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    />
                  ) : (
                    <img className={styles.icon} src={fileImg.src} alt="File" />
                  )}
                  <div className={styles.docInfo}>
                    {doc.title && (
                      <div className={styles.docTitle}>{doc.title}</div>
                    )}
                    <div className={styles.fileName}>{fileName}</div>
                    {doc.uploadedAt && (
                      <div className={styles.uploadedAt}>
                        Uploaded: {formatDate(doc.uploadedAt)}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.actions}>
                  <Button
                    title="Open"
                    imgUrl={arrowOutImg.src}
                    type="WHITE"
                    onClick={() =>
                      window.open(
                        doc.documentUrl,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  />
                  <Button
                    title="Download"
                    imgUrl={downloadImg.src}
                    type="WHITE"
                    onClick={() => downloadFile(doc.documentUrl, fileName)}
                  />
                </div>
                <div className={styles.actions}>
                  <Button
                    title={
                      reviewedIds.has(doc.id)
                        ? "Revert reviewed status"
                        : "Mark document as reviewed"
                    }
                    type="WHITE"
                    isSelected={reviewedIds.has(doc.id)}
                    onClick={async () => {
                      try {
                        setReviewLoadingId(doc.id);
                        await toggleDocumentReviewed(doc.id);
                        setReviewedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(doc.id)) {
                            next.delete(doc.id);
                          } else {
                            next.add(doc.id);
                          }
                          return next;
                        });
                      } catch (e) {
                        console.log(e);
                      } finally {
                        setReviewLoadingId(null);
                      }
                    }}
                    isLoading={reviewLoadingId === doc.id}
                    isDisabled={reviewLoadingId === doc.id}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.empty}>No documents uploaded yet.</div>
        )}
      </div>
      <div className={styles.backBtnWrapper}>
        <Button title="Back" type="PRIMARY" onClick={onBackClick} />
      </div>
    </div>
  );
};

export default DocumentsSection;
