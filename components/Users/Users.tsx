import { useState } from "react";
import Button from "../Button/Button";
import SearchBar from "../SearchBar/SearchBar";
import Cards from "./Cards/Cards";
import styles from "./users.module.css";

const Users = () => {
  const [isSelectedClients, setSelectedClients] = useState(false);
  const [isSelectedProviders, setSelectedProviders] = useState(false);
  return (
    <div className={styles.main}>
      <div className={styles.heading}>
        <div className={styles.headingLeftSide}>
          <Button
            onClick={() => {
              setSelectedProviders(false);
              setSelectedClients(true);
            }}
            title="Clients"
            type="PLAIN"
            isSelected={isSelectedClients}
          />
          <Button
            onClick={() => {
              setSelectedProviders(true);
              setSelectedClients(false);
            }}
            title="Providers"
            type="PLAIN"
            isSelected={isSelectedProviders}
          />
        </div>
        <div>
          <SearchBar placeholder="Type user name or ID" />
        </div>
      </div>
      {isSelectedClients && <Cards />}
    </div>
  );
};

export default Users;
