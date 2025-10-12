import { nunito } from "@/helpers/fonts";
import styles from "./priceSummary.module.css";

type PriceSummaryProps = {
  hourlyRate: number;
  duration: number;
  subtotal: number;
  uegentFee: number;

  serviceFee: number;
  totalProviderPrice: number;
  totalorderCost: number;
};

const PriceSummary = ({
  hourlyRate,
  duration,
  subtotal,
  uegentFee,
  serviceFee,
  totalorderCost,
  totalProviderPrice,
}: PriceSummaryProps) => {
  return (
    <div className={`${styles.main} ${nunito.className}`}>
      <div className={styles.prices}>
        <div className={styles.pricesSide}>
          <div className={styles.info}>
            <span className={styles.infoTitle}>Price</span>
            <span className={styles.infoValue}>{`€${hourlyRate.toFixed(
              2
            )} / hour`}</span>
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
            <span className={styles.infoValue}>{`€${subtotal.toFixed(
              2
            )}`}</span>
          </div>
          <div className={styles.info}>
            <span className={styles.infoTitle}>Urgent fee</span>
            <span className={styles.infoValue}>{`€${uegentFee.toFixed(
              2
            )} (€5+10%)`}</span>
          </div>
        </div>
        <div className={styles.info}>
          <span className={styles.infoTitle}>Service fee</span>
          <span className={styles.infoValue}>{`€${serviceFee.toFixed(
            2
          )} (10%)`}</span>
        </div>
        <div className={styles.info}>
          <span className={styles.infoTitle}>Final sitter fee</span>
          <span className={styles.infoValue}>{`€${totalProviderPrice.toFixed(
            2
          )}`}</span>
        </div>
      </div>
      <div className={`${styles.total} ${nunito.className}`}>
        <span>Total</span>
        <span>{`€${totalorderCost.toFixed(2)}`}</span>
      </div>
    </div>
  );
};

export default PriceSummary;
