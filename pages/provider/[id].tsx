import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DetailedClient from "@/components/Users/DetailedClient/DetailedClient";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { getUserById } from "@/pages/api/fetch";

const DetailedProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const fetchDetailedClient = async (id: string) => {
    try {
      const response = await getUserById(id);
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
      {user && <DetailedClient user={user} />}
    </ModalPageTemplate>
  );
};

export default DetailedProfilePage;
