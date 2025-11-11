import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DetailedUser from "@/components/Users/DetailedUser/DetailedUser";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { getProviderById } from "@/pages/api/fetch";

const DetailedProfilePage = () => {
  const router = useRouter();
  const [provider, setProvider] = useState(null);

  const fetchDetailedProvider = async (id: string) => {
    try {
      const response = await getProviderById(id);
      setProvider(response.data.providerDetails);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    router.query.id && fetchDetailedProvider(router.query.id as string);
  }, [router.query.id]);

  return (
    <ModalPageTemplate isScrollable={true}>
      {provider && <DetailedUser user={provider} mode="provider" />}
    </ModalPageTemplate>
  );
};

export default DetailedProfilePage;
