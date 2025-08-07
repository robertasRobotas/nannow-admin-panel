import { useRouter } from "next/router";
import styles from "./detailedProfilePage.module.css";
import { useEffect, useState } from "react";
import DetailedClient from "@/components/Users/DetailedClient/DetailedClient";
import Header from "@/components/Header/Header";
import { clients } from "@/mocks/clients";

const DetailedProfilePage = () => {
  const router = useRouter();
  const [client, setClient] = useState(null);

  const getDetailedClient = (id: string) => {
    const response = clients.find((c) => c.id === id);
    setClient(response);
  };

  useEffect(() => {
    router.query.id && getDetailedClient(router.query.id as string);
  }, [router.query.id]);

  return (
    <div className={styles.wrapper}>
      <Header />
      {client && <DetailedClient client={client} />}
    </div>
  );
};

export default DetailedProfilePage;
