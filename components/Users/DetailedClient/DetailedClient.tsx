import { ClientDetails } from "@/types/Client";
import styles from "./detailedClient.module.css";
import { useState } from "react";
import GeneralSection from "./GeneralSection/GeneralSection";
import ProfileMenu from "./ProfileMenu/ProfileMenu";
import { useMediaQuery } from "react-responsive";
import MessagesSection from "./MessagesSection/MessagesSection";
import ChildrenSection from "./ChildrenSection/ChildrenSection";
import AddressesSection from "./AddressesSection/AddressesSection";

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
      case "messages": {
        return (
          <MessagesSection
            onBackClick={() => {
              setSelectedSection("");
              setIsSelectedMenu(true);
            }}
            chats={client.chats}
            userId={client.user.id}
          />
        );
      }
      case "children": {
        return (
          <ChildrenSection
            childrenData={client.children}
            onBackClick={() => {
              setSelectedSection("");
              setIsSelectedMenu(true);
            }}
          />
        );
      }
      case "addresses": {
        return (
          <AddressesSection
            addresses={client.addresses}
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
        <>
          <div
            className={styles.menuWrapper}
            style={{ display: isSelectedMenu ? "block" : "none" }}
          >
            <ProfileMenu
              client={client}
              setIsSelectedMenu={() => setIsSelectedMenu(false)}
              selectedSection={selectedSection}
              setSelectedSection={setSelectedSection}
            />
          </div>
          <div
            className={styles.sectionWrapper}
            style={{ display: !isSelectedMenu ? "block" : "none" }}
          >
            {renderSelectedSection()}
          </div>
        </>
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
