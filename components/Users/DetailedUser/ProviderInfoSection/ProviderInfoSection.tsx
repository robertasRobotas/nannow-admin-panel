import Button from "@/components/Button/Button";
import { nunito } from "@/helpers/fonts";
import { QualityType, UserDetails } from "@/types/Client";
import { useMediaQuery } from "react-responsive";
import styles from "./providerInfoSection.module.css";

type ProviderInfoSectionProps = {
  provider: UserDetails["provider"];
  onBackClick: () => void;
};

const QUALITY_LABELS: Record<QualityType, string> = {
  CAN_BABYSIT_AT_HOME: "Can babysit at home",
  LT_LANGUAGE: "Lithuanian language",
  FIRST_AID: "First aid",
  DRIVER_LICENSE: "Driver license",
  CAR: "Car",
  CAN_SHOP: "Can shop",
  CAN_CLEAN: "Can clean",
  NON_SMOKER: "Non-smoker",
  CAN_GO_OUTSIDE: "Can go outside",
  CAN_COOK: "Can cook",
  LOVES_PETS: "Loves pets",
  CAN_SWIM: "Can swim",
  PRIMARY_SCHOOL_TEACHER: "Primary school teacher",
  SINGING_TEACHER: "Singing teacher",
  DANCE_TEACHER: "Dance teacher",
  GUITAR: "Guitar",
  PIANO: "Piano",
  CAT_ALLERGY: "Cat allergy",
  DOG_ALLERGY: "Dog allergy",
  ASTHMA: "Asthma",
};

const getQualityLabel = (quality: QualityType) =>
  QUALITY_LABELS[quality] ?? quality.replace(/_/g, " ").toLowerCase();

const ProviderInfoSection = ({
  provider,
  onBackClick,
}: ProviderInfoSectionProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const intro = provider?.intro?.trim();
  const qualities = provider?.qualitiesIds ?? [];

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>Provider info</h3>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Intro</span>
          <span className={styles.counter}>{intro?.length ?? 0}/1000</span>
        </div>
        {intro ? (
          <p className={`${styles.intro} ${nunito.className}`}>{intro}</p>
        ) : (
          <div className={styles.empty}>No intro added</div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Qualities</span>
          <span className={styles.counter}>{qualities.length}</span>
        </div>
        {qualities.length > 0 ? (
          <div className={styles.qualityList}>
            {qualities.map((quality) => (
              <span key={quality} className={styles.quality}>
                {getQualityLabel(quality)}
              </span>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>No qualities selected</div>
        )}
      </section>

      {isMobile && (
        <div className={styles.backBtnWrapper}>
          <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        </div>
      )}
    </div>
  );
};

export default ProviderInfoSection;
