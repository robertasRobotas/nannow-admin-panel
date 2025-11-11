import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DetailedUser from "@/components/Users/DetailedUser/DetailedUser";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { getClientById } from "@/pages/api/fetch";

const DetailedProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const fetchDetailedClient = async (id: string) => {
    try {
      const response = await getClientById(id);
      setUser(response.data.clientDetails);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    router.query.id && fetchDetailedClient(router.query.id as string);
  }, [router.query.id]);

  return (
    <ModalPageTemplate isScrollable={true}>
      {user && <DetailedUser user={user} mode="client" />}
    </ModalPageTemplate>
  );
};

export default DetailedProfilePage;
