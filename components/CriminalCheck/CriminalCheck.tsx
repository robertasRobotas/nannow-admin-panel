import { useState } from "react";
import styles from "./criminalCheck.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "../Button/Button";

const CriminalCheck = () => {
  const [selected, setSelected] = useState<
    "all" | "not-provided" | "pending" | "approved" | "rejected"
  >("all");
  const [users, setUsers] = useState([]);

  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>
        <span>Criminal check</span>
      </div>
      <div className={styles.categoryBtns}>
        <Button
          onClick={() => setSelected("all")}
          title="All"
          type="PLAIN"
          isSelected={selected === "all"}
        />
        <Button
          onClick={() => setSelected("not-provided")}
          title="Not Provided"
          type="PLAIN"
          isSelected={selected === "not-provided"}
        />
        <Button
          onClick={() => setSelected("pending")}
          title="Pending"
          type="PLAIN"
          isSelected={selected === "pending"}
        />
        <Button
          onClick={() => setSelected("approved")}
          title="Approved"
          type="PLAIN"
          isSelected={selected === "approved"}
        />
        <Button
          onClick={() => setSelected("rejected")}
          title="Rejected"
          type="PLAIN"
          isSelected={selected === "rejected"}
        />
      </div>
      <div className={styles.profileList}></div>
    </div>
  );
};

export default CriminalCheck;
