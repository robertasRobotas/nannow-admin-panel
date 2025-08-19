import { useRouter } from "next/router";
import styles from "./detailedProfilePage.module.css";
import { useEffect, useState } from "react";
import DetailedClient from "@/components/Users/DetailedClient/DetailedClient";
import Header from "@/components/Header/Header";
import axios from "axios";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";

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
    <ModalPageTemplate>
      {client && <DetailedClient client={client} />}
    </ModalPageTemplate>
  );
};

export default DetailedProfilePage;
