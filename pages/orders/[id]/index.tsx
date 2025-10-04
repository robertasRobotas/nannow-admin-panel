import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getOrderById } from "@/pages/api/fetch";
import DetailedOrder from "@/components/Orders/DetailedOrder/DetailedOrder";

const DetailedOrderPage = () => {
  const [order, setOrder] = useState(null);
  const router = useRouter();

  const fetchOrder = async (id: string) => {
    const response = await getOrderById(id);
    setOrder(response.data.result);
  };

  useEffect(() => {
    router.query.id && fetchOrder(router.query.id as string);
  }, [router.query.id]);
  return (
    <ModalPageTemplate>
      {order && <DetailedOrder order={order} />}
    </ModalPageTemplate>
  );
};

export default DetailedOrderPage;
