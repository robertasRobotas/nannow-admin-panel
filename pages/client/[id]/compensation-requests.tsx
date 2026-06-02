import DetailedUser from "@/components/Users/DetailedUser/DetailedUser";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { getClientById, getUserChatsById } from "@/pages/api/fetch";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const ClientCompensationRequestsPage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const fetchDetailedClient = async (id: string) => {
    try {
      const [clientResponse, chatsResponse] = await Promise.all([
        getClientById(id),
        getUserChatsById(id),
      ]);
      setUser({
        ...clientResponse.data.clientDetails,
        chats: chatsResponse.data?.result ?? [],
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    router.query.id && fetchDetailedClient(router.query.id as string);
  }, [router.query.id]);

  return (
    <ModalPageTemplate isScrollable={true}>
      {user && (
        <DetailedUser
          user={user}
          mode="client"
          initialSection="compensation_requests"
        />
      )}
    </ModalPageTemplate>
  );
};

export default ClientCompensationRequestsPage;
