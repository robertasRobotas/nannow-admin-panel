import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import Reviews from "@/components/Reviews/Reviews";

const ReviewsPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <Reviews />
    </ModalPageTemplate>
  );
};

export default ReviewsPage;
