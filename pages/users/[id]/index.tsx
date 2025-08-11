import { useRouter } from "next/router";
import styles from "./detailedProfilePage.module.css";
import { useEffect, useState } from "react";
import DetailedClient from "@/components/Users/DetailedClient/DetailedClient";
import Header from "@/components/Header/Header";
import axios from "axios";

const DetailedProfilePage = () => {
  const router = useRouter();
  const [client, setClient] = useState(null);

  const getDetailedClient = async (id: string) => {
    const response = await axios.get(
      `https://nannow-api.com/admin/clients/${id}`
    );
    console.log(response);
    setClient(response.data.clientDetails);
  };

  useEffect(() => {
    router.query.id && getDetailedClient(router.query.id as string);
  }, [router.query.id]);

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.contentWrapper}>
        {client && <DetailedClient client={client} />}
      </div>
    </div>
  );
};

export default DetailedProfilePage;
