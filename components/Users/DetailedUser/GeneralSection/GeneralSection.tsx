import { getInfoCards } from "@/data/generalInfoCards";
import styles from "./generalSection.module.css";
import { nunito } from "@/helpers/fonts";
import { UserDetails } from "@/types/Client";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";

type GeneralSectionProps = {
  user: UserDetails;
  onBackClick: () => void;
};

const GeneralSection = ({ user, onBackClick }: GeneralSectionProps) => {
  const cards = getInfoCards(user);
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>General info</h3>
      <div className={styles.infoCardsWrapper}>
        {cards.map((c, i) => (
          <div key={i} className={styles.card}>
            <img src={c.icon.src} alt="Icon" />
            <span className={styles.cardTitle}>{c.title}</span>
            <span className={`${styles.cardValue} ${nunito.className}`}>
              {c.value}
            </span>
          </div>
        ))}
      </div>
      {isMobile && (
        <div className={styles.backBtnWrapper}>
          <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        </div>
      )}
    </div>
  );
};

export default GeneralSection;
