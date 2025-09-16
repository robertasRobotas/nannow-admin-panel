import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import styles from "./ordersPage.module.css";
import Orders from "@/components/Orders/Orders";

const OrdersPage = () => {
  return (
    <ModalPageTemplate>
      <Orders />
    </ModalPageTemplate>
  );
};

export default OrdersPage;
