import { nunito } from "@/helpers/fonts";
import styles from "./priceSummary.module.css";

type PriceSummaryProps = {
  hourlyRate: number;
  duration: number;
  subtotal: number;
  serviceFee: number;
  total: number;
};

const PriceSummary = ({
  hourlyRate,
  duration,
  subtotal,
  serviceFee,
  total,
}: PriceSummaryProps) => {
  return (
    <div className={`${styles.main} ${nunito.className}`}>
      <div className={styles.prices}>
        <div className={styles.pricesSide}>
          <div className={styles.info}>
            <span className={styles.infoTitle}>Price</span>
            <span className={styles.infoValue}>{`€${hourlyRate} / hour`}</span>
          </div>
          <div className={styles.info}>
            <span className={styles.infoTitle}>Duration</span>
            <span className={styles.infoValue}>
              {duration > 1 ? `${duration} hours` : `${duration} hour`}
            </span>
          </div>
        </div>
        <div className={styles.pricesSide}>
          <div className={styles.info}>
            <span className={styles.infoTitle}>Subtotal</span>
            <span className={styles.infoValue}>{`€${subtotal}`}</span>
          </div>
          <div className={styles.info}>
            <span className={styles.infoTitle}>Service fee</span>
            <span className={styles.infoValue}>{`€${serviceFee} (10%)`}</span>
          </div>
        </div>
      </div>
      <div className={`${styles.total} ${nunito.className}`}>
        <span>Total</span>
        <span>{`€${total}`}</span>
      </div>
    </div>
  );
};

export default PriceSummary;
