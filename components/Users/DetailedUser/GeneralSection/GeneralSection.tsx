import { getInfoCards } from "@/data/generalInfoCards";
import styles from "./generalSection.module.css";
import { nunito } from "@/helpers/fonts";
import { UserDetails } from "@/types/Client";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { useRouter } from "next/router";
import Image from "next/image";

type GeneralSectionProps = {
  user: UserDetails;
  mode: "client" | "provider";
  onBackClick: () => void;
};

const GeneralSection = ({ user, mode, onBackClick }: GeneralSectionProps) => {
  const cards = getInfoCards(user, mode);
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const router = useRouter();
  console.log(user);

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>General info</h3>
      <div className={styles.infoCardsWrapper}>
        {cards.map((c, i) => (
          <div key={i} className={styles.card}>
            <Image src={c.icon} alt="Icon" />

            <span className={styles.cardTitle}>{c.title}</span>
            <span className={`${styles.cardValue} ${nunito.className}`}>
              {c.value}
            </span>
            {c.link && (
              <Button
                title="Details"
                type="OUTLINED"
                onClick={() => router.push(c.link!)}
              />
            )}
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
