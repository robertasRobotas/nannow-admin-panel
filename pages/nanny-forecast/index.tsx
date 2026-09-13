import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import NannyForecast from "@/components/NannyForecast/NannyForecast";

const NannyForecastPage = () => {
  return (
    <ModalPageTemplate isScrollable={true}>
      <NannyForecast />
    </ModalPageTemplate>
  );
};

export default NannyForecastPage;
