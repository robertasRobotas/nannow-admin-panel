import { useEffect, useState } from "react";
import styles from "./orders.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "../Button/Button";

const Orders = () => {
  const [selected, setSelected] = useState<
    "ALL" | "IN_PROGRESS" | "WAITING_APPROVAL" | "COMPLETED" | "CANCELED"
  >("ALL");

  /*
  const fetchUsers = async (status: string) => {
    const users = await getUsersByCriminalRecordStatus(status);
    setUsers(users.data.users.items);
  };

  useEffect(() => {
    fetchUsers(selected === "ALL" ? "" : selected);
  }, [selected]);

  */
  return (
    <div className={styles.main}>
      <div className={`${styles.title} ${nunito.className}`}>
        <span>Orders</span>
      </div>
      <div className={styles.categoryBtns}>
        <Button
          onClick={() => setSelected("ALL")}
          title="All"
          type="PLAIN"
          isSelected={selected === "ALL"}
        />
        <Button
          onClick={() => setSelected("IN_PROGRESS")}
          title="In Progress"
          type="PLAIN"
          isSelected={selected === "IN_PROGRESS"}
        />
        <Button
          onClick={() => setSelected("WAITING_APPROVAL")}
          title="Waiting approval"
          type="PLAIN"
          isSelected={selected === "WAITING_APPROVAL"}
        />
        <Button
          onClick={() => setSelected("COMPLETED")}
          title="Completed"
          type="PLAIN"
          isSelected={selected === "COMPLETED"}
        />
        <Button
          onClick={() => setSelected("CANCELED")}
          title="Canceled"
          type="PLAIN"
          isSelected={selected === "CANCELED"}
        />
      </div>
      <div className={styles.ordersWrapper}></div>
    </div>
  );
};

export default Orders;
