import { UserDetails } from "@/types/Client";
import styles from "./detailedClient.module.css";
import { useState } from "react";
import GeneralSection from "./GeneralSection/GeneralSection";
import ProfileMenu from "./ProfileMenu/ProfileMenu";
import { useMediaQuery } from "react-responsive";
import MessagesSection from "./MessagesSection/MessagesSection";
import ChildrenSection from "./ChildrenSection/ChildrenSection";
import AddressesSection from "./AddressesSection/AddressesSection";
import ReviewsSection from "./ReviewsSection/ReviewsSection";
import BadgesSection from "./BadgesSection/BadgesSection";

type DetailedClientProps = {
  user: UserDetails;
  mode: "client" | "provider";
};

const DetailedClient = ({ user, mode }: DetailedClientProps) => {
  const [selectedSection, setSelectedSection] = useState("general");
  //for responsive
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [isSelectedMenu, setIsSelectedMenu] = useState(false);

  const renderSelectedSection = () => {
    switch (selectedSection) {
      case "general": {
        return (
          <GeneralSection
            user={user}
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
            chats={user.chats}
            userId={user.user.id}
          />
        );
      }
      case "children": {
        return (
          <ChildrenSection
            childrenData={user.children}
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
            addresses={user.addresses}
            onBackClick={() => {
              setSelectedSection("");
              setIsSelectedMenu(true);
            }}
          />
        );
      }
      case "given_reviews": {
        return (
          <ReviewsSection
            title="Given Reviews"
            reviews={user.givenReviews}
            onBackClick={() => {
              setSelectedSection("");
              setIsSelectedMenu(true);
            }}
          />
        );
      }
      case "received_reviews": {
        return (
          <ReviewsSection
            title="Received Reviews"
            reviews={user.receivedReviews}
            onBackClick={() => {
              setSelectedSection("");
              setIsSelectedMenu(true);
            }}
          />
        );
      }

      case "badges": {
        return (
          <BadgesSection
            selectedBadges={user?.provider?.badgesIds ?? []}
            providerUserId={user.user.id}
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
              user={user}
              setIsSelectedMenu={() => setIsSelectedMenu(false)}
              selectedSection={selectedSection}
              setSelectedSection={setSelectedSection}
              mode={mode}
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
            user={user}
            setIsSelectedMenu={() => setIsSelectedMenu(false)}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            mode={mode}
          />
          <div className={styles.sectionWrapper}>{renderSelectedSection()}</div>
        </>
      )}
    </div>
  );
};

export default DetailedClient;
