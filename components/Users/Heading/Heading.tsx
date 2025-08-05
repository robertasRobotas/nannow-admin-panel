import HeaderButton from "@/components/HeaderButton/HeaderButton";
import styles from "./heading.module.css";
import SearchBar from "@/components/SearchBar/SearchBar";

const Heading = () => {
  return (
    <div className={styles.main}>
      <div className={styles.headingLeftSide}>
        <HeaderButton title="Clients" isActive={true} />
        <HeaderButton title="Providers" isActive={false} />
      </div>
      <div>
        <SearchBar placeholder="Type user name or ID" />
      </div>
    </div>
  );
};

export default Heading;
