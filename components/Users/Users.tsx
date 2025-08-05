import Cards from "./Cards/Cards";
import Heading from "./Heading/Heading";
import styles from "./users.module.css";

const Users = () => {
  return (
    <div className={styles.main}>
      <Heading />
      <Cards />
    </div>
  );
};

export default Users;
