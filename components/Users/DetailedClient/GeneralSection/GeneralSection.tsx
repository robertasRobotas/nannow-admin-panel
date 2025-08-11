import { getInfoCards } from "@/data/generalInfoCards";
import styles from "./generalSection.module.css";
import { nunito } from "@/helpers/fonts";
import { ClientDetails } from "@/types/Client";

type GeneralSectionProps = {
  client: ClientDetails;
};

const GeneralSection = ({ client }: GeneralSectionProps) => {
  const cards = getInfoCards(client);

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
    </div>
  );
};

export default GeneralSection;
