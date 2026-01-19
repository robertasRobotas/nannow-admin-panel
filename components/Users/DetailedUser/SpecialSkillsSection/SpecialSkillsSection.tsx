/* eslint-disable @next/next/no-img-element */
import styles from "./specialSkillsSection.module.css";
import Button from "@/components/Button/Button";
import arrowOutImg from "../../../../assets/images/arrow-out.svg";
import downloadImg from "../../../../assets/images/download.svg";
import fileImg from "../../../../assets/images/download.svg";
import { useEffect, useState } from "react";
import { toggleDocumentReviewed } from "@/pages/api/fetch";

type Skill = {
  documentId?: string;
  status?: string;
  verifiedAt?: string;
  appliedAt?: string;
  verifiedByAdminId?: string;
  document?: {
    id: string;
    title?: string;
    description?: string;
    uploadedAt?: string;
    documentUrl: string;
    isEditable?: boolean;
    documentCategories?: string;
    reviewerId?: string;
    reviewedAt?: string;
  };
};

type SpecialSkills = {
  firstAid?: Skill;
  teacher?: Skill;
  professionalNanny?: Skill;
  artEducator?: Skill;
  language?: Skill;
  psychologist?: Skill;
  sportsCoach?: Skill;
};

type SpecialSkillsSectionProps = {
  specialSkills?: SpecialSkills;
  providerId?: string;
  onBackClick: () => void;
};

const isImageUrl = (url: string) =>
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test((url?.split("?")[0] ?? url) || "");

const getFileName = (url: string) => {
  const m = url.match(/[^\\/]+$/);
  return m ? m[0] : url;
};

const appendS3DownloadParam = (url: string, filename: string) => {
  const hasQuery = url.includes("?");
  const encoded = encodeURIComponent(`attachment; filename="${filename}"`);
  return `${url}${hasQuery ? "&" : "?"}response-content-disposition=${encoded}`;
};

const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!response.ok) throw new Error("Failed to fetch file");
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

const LABELS: Record<keyof SpecialSkills, string> = {
  firstAid: "First aid",
  teacher: "Teacher",
  professionalNanny: "Professional nanny",
  artEducator: "Art educator",
  language: "Language",
  psychologist: "Psychologist",
  sportsCoach: "Sports coach",
};

const ALL_KEYS: (keyof SpecialSkills)[] = [
  "firstAid",
  "teacher",
  "professionalNanny",
  "artEducator",
  "language",
  "psychologist",
  "sportsCoach",
];

const getStatusClass = (status?: string) => {
  if (!status) return styles.blank;
  const up = status.toUpperCase();
  if (up === "APPROVED") return styles.verified;
  if (up === "PENDING") return styles.verifying;
  if (up === "REJECTED") return styles.rejected;
  return styles.blank;
};

const fmt = (iso?: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const SpecialSkillsSection = ({
  specialSkills,
  providerId,
  onBackClick,
}: SpecialSkillsSectionProps) => {
  const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);
  const [reviewedDocIds, setReviewedDocIds] = useState<Set<string>>(new Set());
  const [statusByKey, setStatusByKey] = useState<
    Record<string, string | undefined>
  >(() => {
    const initial: Record<string, string | undefined> = {};
    ALL_KEYS.forEach((k) => (initial[k] = specialSkills?.[k]?.status));
    return initial;
  });

  useEffect(() => {
    const initial = new Set<string>();
    ALL_KEYS.forEach((k) => {
      const d = specialSkills?.[k]?.document;
      if (d?.reviewedAt || d?.reviewedAt || d?.reviewerId) {
        initial.add(d.id);
      }
    });
    setReviewedDocIds(initial);
    const initialStatuses: Record<string, string | undefined> = {};
    ALL_KEYS.forEach((k) => (initialStatuses[k] = specialSkills?.[k]?.status));
    setStatusByKey(initialStatuses);
  }, [specialSkills]);
  return (
    <div className={styles.main}>
      <h3 className={styles.title}>Special skills</h3>
      <div className={styles.list}>
        {ALL_KEYS.map((key) => {
          const s = specialSkills?.[key];
          const statusClass = getStatusClass(statusByKey[key] ?? s?.status);
          const doc = s?.document;
          const isReviewed = doc?.id ? reviewedDocIds.has(doc.id) : false;
          return (
            <div className={styles.item} key={key}>
              <div className={styles.row}>
                <div className={styles.left}>
                  <div className={styles.skillName}>{LABELS[key]}</div>
                  <div className={`${styles.statusBadge} ${statusClass}`}>
                    {statusByKey[key] ?? s?.status ?? "No data"}
                  </div>
                </div>
                <div className={styles.right}>
                  {s?.documentId && (
                    <div className={styles.meta}>
                      <span className={styles.metaLabel}>Document ID:</span>
                      <span className={styles.metaValue}>{s.documentId}</span>
                    </div>
                  )}
                  {s?.appliedAt && (
                    <div className={styles.meta}>
                      <span className={styles.metaLabel}>Applied:</span>
                      <span className={styles.metaValue}>
                        {fmt(s.appliedAt)}
                      </span>
                    </div>
                  )}
                  {s?.verifiedAt && (
                    <div className={styles.meta}>
                      <span className={styles.metaLabel}>Verified:</span>
                      <span className={styles.metaValue}>
                        {fmt(s.verifiedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.statusDropdownWrapper}>
                <StatusDropdown
                  providerId={providerId}
                  skillKey={key}
                  onChangedStatus={(newStatus) =>
                    setStatusByKey((prev) => ({ ...prev, [key]: newStatus }))
                  }
                />
              </div>
              {doc && (
                <div className={styles.docBlock}>
                  <div className={styles.docTop}>
                    {isImageUrl(doc.documentUrl) ? (
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
                        src={fileImg.src}
                        alt="File"
                      />
                    )}
                    <div className={styles.docInfo}>
                      {doc.title && (
                        <div className={styles.docTitle}>{doc.title}</div>
                      )}
                      <div className={styles.fileName}>
                        {getFileName(doc.documentUrl)}
                      </div>
                      {doc.uploadedAt && (
                        <div className={styles.uploadedAt}>
                          Uploaded: {fmt(doc.uploadedAt)}
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
                      onClick={() =>
                        downloadFile(
                          doc.documentUrl,
                          getFileName(doc.documentUrl)
                        )
                      }
                    />
                  </div>
                  <div className={styles.actions}>
                    <Button
                      title={
                        isReviewed
                          ? "Revert reviewed status"
                          : "Mark document as reviewed"
                      }
                      type="WHITE"
                      isSelected={isReviewed}
                      onClick={async () => {
                        if (!doc?.id) return;
                        try {
                          setReviewLoadingId(doc.id);
                          await toggleDocumentReviewed(doc.id);
                          setReviewedDocIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(doc.id)) next.delete(doc.id);
                            else next.add(doc.id);
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
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.backBtnWrapper}>
        <Button title="Back" type="PRIMARY" onClick={onBackClick} />
      </div>
    </div>
  );
};

export default SpecialSkillsSection;

// Local helper component: dropdown to change skill status
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import { reviewSpecialSkill } from "@/pages/api/fetch";
import { Dispatch, SetStateAction } from "react";

type StatusDropdownProps = {
  providerId?: string;
  skillKey: keyof SpecialSkills;
  onChangedStatus: (status: "APPROVED" | "REJECTED" | "PENDING") => void;
};

const toEnumKey = (key: keyof SpecialSkills) => {
  switch (key) {
    case "firstAid":
      return "FIRST_AID";
    case "teacher":
      return "TEACHER";
    case "professionalNanny":
      return "PROFESSIONAL_NANNY";
    case "artEducator":
      return "ART_EDUCATOR";
    case "language":
      return "LANGUAGE";
    case "psychologist":
      return "PSYCHOLOGIST";
    case "sportsCoach":
      return "SPORTS_COACH";
  }
};

const STATUS_OPTIONS = [
  { title: "Change status", value: "" },
  { title: "Set APPROVED", value: "APPROVED" },
  { title: "Set REJECTED", value: "REJECTED" },
  { title: "Set PENDING", value: "PENDING" },
] as const;

const StatusDropdown = ({
  providerId,
  skillKey,
  onChangedStatus,
}: StatusDropdownProps) => {
  const [selected, setSelected] = useState<number>(0);

  const handleChange = async (nextIndex: number) => {
    setSelected(nextIndex);
    if (nextIndex === 0) return;
    const status = STATUS_OPTIONS[nextIndex].value as
      | "APPROVED"
      | "REJECTED"
      | "PENDING";
    if (!providerId) return;
    try {
      await reviewSpecialSkill(providerId, toEnumKey(skillKey), status);
      onChangedStatus(status);
    } catch (e) {
      console.log(e);
    } finally {
      // reset to "Change status" label
      setSelected(0);
    }
  };

  return (
    <div className={styles.actions}>
      <DropDownButton
        options={
          STATUS_OPTIONS as unknown as { title: string; value: string }[]
        }
        selectedOption={selected}
        setSelectedOption={
          handleChange as unknown as Dispatch<SetStateAction<number>>
        }
        onClickOption={undefined}
      />
    </div>
  );
};
