import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getCriminalCheckById } from "@/pages/api/fetch";
import DetailedCriminalCheck from "@/components/CriminalCheck/DetailedCriminalCheck/DetailedCriminalCheck";

const DetailedCriminalCheckPage = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  const fetchCriminalCheck = async (id: string) => {
    const response = await getCriminalCheckById(id);
    setUser(response.data.result);
  };

  useEffect(() => {
    router.query.id && fetchCriminalCheck(router.query.id as string);
  }, [router.query.id]);
  return (
    <ModalPageTemplate>
      {user && <DetailedCriminalCheck user={user} />}
    </ModalPageTemplate>
  );
};

export default DetailedCriminalCheckPage;
