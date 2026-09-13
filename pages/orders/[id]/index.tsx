import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getOrderById } from "@/pages/api/fetch";
import DetailedOrder from "@/components/Orders/DetailedOrder/DetailedOrder";
import OrderHistory from "@/components/Orders/DetailedOrder/OrderHistory";
import styles from "@/components/Orders/DetailedOrder/orderDetailsPage.module.css";
import type { DetailedOrderType } from "@/types/DetailedOrder";

const DetailedOrderPage = () => {
  const [order, setOrder] = useState<DetailedOrderType | null>(null);
  const router = useRouter();

  const fetchOrder = async (id: string) => {
    const response = await getOrderById(id);
    console.log("Fetched order:", response.data.result);
    setOrder(response.data.result);
  };

  useEffect(() => {
    if (router.query.id) {
      void fetchOrder(router.query.id as string);
    }
  }, [router.query.id]);
  return (
    <ModalPageTemplate>
      {order && (
        <div className={styles.orderDetailsStack}>
          <DetailedOrder order={order} />
          <OrderHistory orderId={order.id} />
        </div>
      )}
    </ModalPageTemplate>
  );
};

export default DetailedOrderPage;
