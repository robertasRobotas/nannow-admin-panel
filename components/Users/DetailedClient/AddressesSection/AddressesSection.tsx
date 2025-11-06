import styles from "./addressesSection.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { UserDetails } from "@/types/Client";

type AddressesSectionProps = {
  addresses: UserDetails["addresses"];
  onBackClick: () => void;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

const AddressesSection = ({
  addresses,
  onBackClick,
}: AddressesSectionProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>Addresses</h3>
      <div className={styles.list}>
        {addresses?.length ? (
          addresses.map((a) => (
            <div key={a.id} className={styles.item}>
              <div className={styles.row}>
                <span className={styles.label}>Country</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {a.country}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>City</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {a.city}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Street</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {a.street}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>House number</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {a.houseNumber}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Postal code</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {a.postalCode}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Coordinates</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {a.latitude.toFixed(6)}, {a.longitude.toFixed(6)}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Default</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {a.isDefault ? "Yes" : "No"}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Created</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {formatDate(a.createdAt)}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Updated</span>
                <span className={`${styles.value} ${nunito.className}`}>
                  {formatDate(a.updatedAt)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.empty}>No addresses added</div>
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

export default AddressesSection;
