import styles from "./childrenSection.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { UserDetails } from "@/types/Client";

type ChildrenSectionProps = {
  childrenData: UserDetails["children"];
  onBackClick: () => void;
};

const toTitleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const formatList = (list: string[]) =>
  !list || list.length === 0
    ? "-"
    : list.every((v) => v === "NONE")
    ? "None"
    : list.join(", ");

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

const ChildrenSection = ({
  childrenData,
  onBackClick,
}: ChildrenSectionProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>Children</h3>
      <div className={styles.list}>
        {childrenData?.length ? (
          childrenData.map((child) => (
            <div key={child.id} className={styles.item}>
              <div className={styles.row}>
                <span className={styles.label}>Name</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {child.name}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Gender</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {toTitleCase(child.gender)}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Birth date</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {formatDate(child.birthDate)}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Allergies</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {formatList(child.allergiesIds)}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Disabilities</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {formatList(child.disabilitiesIds)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.empty}>No children added</div>
        )}
      </div>
      {isMobile && (
        <div className={styles.backBtnWrapper}>
          <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        </div>
      )}
    </div>
  );
};

export default ChildrenSection;
