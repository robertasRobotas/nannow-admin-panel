import { useEffect, useState } from "react";
import Button from "../Button/Button";
import SearchBar from "../SearchBar/SearchBar";
import Cards from "./Cards/Cards";
import styles from "./users.module.css";
import axios from "axios";

const Users = () => {
  const [isSelectedClients, setSelectedClients] = useState(true);
  const [isSelectedProviders, setSelectedProviders] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      setUsers([]);
      const url = isSelectedClients
        ? `https://nannow-api.com/admin/users?type=client&startIndex=0&search=${searchText}`
        : `https://nannow-api.com/admin/provider?type=client&startIndex=0&search=${searchText}`;
      const response = await axios.get(url);
      setUsers(response.data.users.items);
      console.log(response);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isSelectedClients]);

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
          <SearchBar
            searchText={searchText}
            setSearchText={setSearchText}
            placeholder="Type user name or ID"
            onButtonClick={() => fetchUsers()}
          />
        </div>
      </div>
      <Cards users={users} />
    </div>
  );
};

export default Users;
