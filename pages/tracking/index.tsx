import { GetServerSideProps } from "next";

const TrackingRedirectPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/map",
      permanent: false,
    },
  };
};

export default TrackingRedirectPage;
