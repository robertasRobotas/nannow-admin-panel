import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DetailedUser from "@/components/Users/DetailedUser/DetailedUser";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { getProviderById, getUserChatsById } from "@/pages/api/fetch";

const DetailedProfilePage = () => {
  const router = useRouter();
  const [provider, setProvider] = useState(null);

  const fetchDetailedProvider = async (id: string) => {
    try {
      const [providerResponse, chatsResponse] = await Promise.all([
        getProviderById(id),
        getUserChatsById(id),
      ]);
      setProvider({
        ...providerResponse.data.providerDetails,
        chats: chatsResponse.data?.result ?? [],
      });
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
