/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import styles from "./documents.module.css";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import { options as documentsStatusOptions } from "@/data/documentsStatusOptions";
import paginateStyles from "@/styles/paginate.module.css";
import Button from "@/components/Button/Button";
import ReactPaginate from "react-paginate";
import { getDocuments, toggleDocumentReviewed } from "@/pages/api/fetch";
import axios from "axios";
import { useRouter } from "next/router";
import fileIcon from "@/assets/images/doc.svg";
import arrowOutImg from "@/assets/images/arrow-out.svg";
import downloadImg from "@/assets/images/download.svg";

type AdminDocument = {
  id: string;
  title?: string;
  description?: string;
  uploadedAt?: string;
  documentUrl: string;
  documentType?: string;
  isEditable?: boolean;
  isReviewed?: boolean;
  reviewed?: boolean;
  reviewedAt?: string;
  adminReviewedAt?: string;
  reviwedAt?: string;
};

const isImageUrl = (url: string) =>
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test((url?.split("?")[0] ?? url) || "");

const getFileName = (url: string) => {
  const m = url?.match(/[^\\/]+$/);
  return m ? m[0] : url ?? "";
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
  const hasQuery = (url ?? "").includes("?");
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
    const forced = appendS3DownloadParam(url, filename);
    window.open(forced, "_blank", "noopener,noreferrer");
  }
};

const Documents = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState(0);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(0);
  const [pageCount, setPageCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);

  const selectedStatus = useMemo(() => {
    const value = documentsStatusOptions[selectedOption]?.value ?? "";
    return value.length > 0
      ? (value as "REVIEWED" | "NOT_REVIEWED")
      : undefined;
  }, [selectedOption]);

  const fetchDocuments = async () => {
    try {
      const response = await getDocuments(itemOffset, selectedStatus);
      const result = response.data.result ?? response.data.documents ?? {};
      const items: AdminDocument[] = result.items ?? [];
      setDocuments(items);
      setItemsPerPage(result.pageSize ?? 0);
      setPageCount(Math.ceil((result.total ?? 0) / (result.pageSize ?? 1)));
      setTotalItems(result.total ?? 0);
      const initial = new Set<string>();
      items?.forEach((d) => {
        if (
          d?.isReviewed ||
          d?.reviewed ||
          d?.reviewedAt ||
          d?.adminReviewedAt ||
          d?.reviwedAt
        ) {
          initial.add(d.id);
        }
      });
      setReviewedIds(initial);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if ((err as any).status === 401) {
          router.push("/");
        }
      }
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemOffset, selectedStatus]);

  const handlePageClick = (event: { selected: number }) => {
    const newOffset =
      (event.selected * (itemsPerPage ?? 0)) % (totalItems ?? 0);
    setItemOffset(newOffset);
  };

  return (
    <div className={styles.main}>
      <div className={styles.toolbar}>
        <div className={styles.title}>Documents</div>
        <DropDownButton
          options={documentsStatusOptions}
          selectedOption={selectedOption}
          setSelectedOption={(idx) => {
            setSelectedOption(idx);
            setItemOffset(0);
          }}
          onClickOption={() => {
            setItemOffset(0);
          }}
        />
      </div>

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
                    <img
                      className={styles.icon}
                      src={fileIcon.src}
                      alt="File"
                    />
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
          <div className={styles.empty}>No documents found.</div>
        )}
      </div>

      <div className={styles.paginateContainer}>
        <ReactPaginate
          breakLabel="..."
          nextLabel=""
          onPageChange={handlePageClick}
          pageRangeDisplayed={1}
          marginPagesDisplayed={1}
          pageCount={pageCount}
          previousLabel=""
          renderOnZeroPageCount={null}
          containerClassName={paginateStyles.paginateWrapper}
          pageClassName={paginateStyles.pageBtn}
          pageLinkClassName={paginateStyles.pageLink}
          activeClassName={paginateStyles.activePage}
          nextClassName={paginateStyles.nextPageBtn}
          nextLinkClassName={paginateStyles.nextLink}
          previousClassName={paginateStyles.prevPageBtn}
          previousLinkClassName={paginateStyles.prevLink}
          breakClassName={paginateStyles.break}
        />
      </div>
    </div>
  );
};

export default Documents;
