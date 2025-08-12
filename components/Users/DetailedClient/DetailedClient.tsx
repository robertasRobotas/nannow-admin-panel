/* eslint-disable @next/next/no-img-element */
import { ClientDetails } from "@/types/Client";
import styles from "./detailedClient.module.css";
import { useState } from "react";
import GeneralSection from "./GeneralSection/GeneralSection";
import ProfileMenu from "./ProfileMenu/ProfileMenu";
import { useMediaQuery } from "react-responsive";

type DetailedClientProps = {
  client: ClientDetails;
};

const DetailedClient = ({ client }: DetailedClientProps) => {
  const [selectedSection, setSelectedSection] = useState("general");
  //for responsive
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [isSelectedMenu, setIsSelectedMenu] = useState(false);

  const renderSelectedSection = () => {
    switch (selectedSection) {
      case "general": {
        return (
          <GeneralSection
            client={client}
            onBackClick={() => {
              setSelectedSection("");
              setIsSelectedMenu(true);
            }}
          />
        );
      }
    }
  };

  return (
    <div className={styles.main}>
      {isMobile ? (
        isSelectedMenu ? (
          <ProfileMenu
            client={client}
            setIsSelectedMenu={() => setIsSelectedMenu(false)}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
          />
        ) : (
          renderSelectedSection()
        )
      ) : (
        <>
          <ProfileMenu
            client={client}
            setIsSelectedMenu={() => setIsSelectedMenu(false)}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
          />
          <div className={styles.sectionWrapper}>{renderSelectedSection()}</div>
        </>
      )}
    </div>
  );
};

export default DetailedClient;
