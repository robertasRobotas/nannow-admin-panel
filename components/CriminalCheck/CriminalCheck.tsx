import { useEffect, useState } from "react";
import styles from "./criminalCheck.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "../Button/Button";
import { getUsersByCriminalRecordStatus } from "@/pages/api/fetch";
import ProfilesList from "./ProfilesList/ProfilesList";

const CriminalCheck = () => {
  const [selected, setSelected] = useState<
    "ALL" | "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [users, setUsers] = useState([]);

  const fetchUsers = async (status: string) => {
    const users = await getUsersByCriminalRecordStatus(status);
    setUsers(users.data.users.items);
  };

  useEffect(() => {
    fetchUsers(selected === "ALL" ? "" : selected);
  }, [selected]);

  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>
        <span>Criminal check</span>
      </div>
      <div className={styles.categoryBtns}>
        <Button
          onClick={() => setSelected("ALL")}
          title="All"
          type="PLAIN"
          isSelected={selected === "ALL"}
        />
        <Button
          onClick={() => setSelected("NOT_SUBMITTED")}
          title="Not Provided"
          type="PLAIN"
          isSelected={selected === "NOT_SUBMITTED"}
        />
        <Button
          onClick={() => setSelected("PENDING")}
          title="Pending"
          type="PLAIN"
          isSelected={selected === "PENDING"}
        />
        <Button
          onClick={() => setSelected("APPROVED")}
          title="Approved"
          type="PLAIN"
          isSelected={selected === "APPROVED"}
        />
        <Button
          onClick={() => setSelected("REJECTED")}
          title="Rejected"
          type="PLAIN"
          isSelected={selected === "REJECTED"}
        />
      </div>
      <div className={styles.profilesWrapper}>
        <ProfilesList users={users} />
      </div>
    </div>
  );
};

export default CriminalCheck;
