import { useEffect, useState } from "react";
import Button from "../Button/Button";
import SearchBar from "../SearchBar/SearchBar";
import Cards from "./Cards/Cards";
import styles from "./users.module.css";
import axios from "axios";
import { getAllUsers } from "@/pages/api/fetch";

const Users = () => {
  const [isSelectedClients, setSelectedClients] = useState(true);
  const [isSelectedProviders, setSelectedProviders] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      setUsers([]);
      const url = isSelectedClients
        ? `admin/users?type=client&startIndex=0&search=${searchText}`
        : `admin/users?type=provider&startIndex=0&search=${searchText}`;
      const response = await getAllUsers(url);
      setUsers(response.data.users.items);
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
            placeholder="Type user name or ID  here"
            onButtonClick={() => fetchUsers()}
          />
        </div>
      </div>
      <Cards users={users} />
    </div>
  );
};

export default Users;
