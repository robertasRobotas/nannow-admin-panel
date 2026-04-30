import { UserDetails } from "@/types/Client";
import styles from "./detailedUser.module.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import GeneralSection from "./GeneralSection/GeneralSection";
import ProfileMenu from "./ProfileMenu/ProfileMenu";
import MessagesSection from "./MessagesSection/MessagesSection";
import ChildrenSection from "./ChildrenSection/ChildrenSection";
import AddressesSection from "./AddressesSection/AddressesSection";
import ReviewsSection from "./ReviewsSection/ReviewsSection";
import BadgesSection from "./BadgesSection/BadgesSection";
import DocumentsSection from "./DocumentsSection/DocumentsSection";
import SpecialSkillsSection from "./SpecialSkillsSection/SpecialSkillsSection";
import AddAdminReviewSection from "./AddAdminReviewSection/AddAdminReviewSection";
import BookedTimeSlotsSection from "./BookedTimeSlotsSection/BookedTimeSlotsSection";
import OrdersSection from "./OrdersSection/OrdersSection";
import ClientOrdersSection from "./ClientOrdersSection/ClientOrdersSection";
import PayoutsSection from "./PayoutsSection/PayoutsSection";
import PaymentsSection from "./PaymentsSection/PaymentsSection";
import { useRouter } from "next/router";
import { getButtonsData } from "@/data/userProfileMenu";
import ProviderInfoSection from "./ProviderInfoSection/ProviderInfoSection";

type DetailedClientProps = {
  user: UserDetails;
  mode: "client" | "provider";
};

const DetailedClient = ({ user, mode }: DetailedClientProps) => {
  const router = useRouter();
  const [selectedSection, setSelectedSectionState] = useState("general");
  const validSectionIds = useMemo(
    () => getButtonsData(user, mode).map((button) => button.id),
    [mode, user],
  );

  const setSelectedSection = useCallback(
    (nextSection: string, method: "push" | "replace" = "push") => {
      setSelectedSectionState(nextSection);
      if (!router.isReady) return;

      const nextQuery = { ...router.query };
      if (nextSection) {
        nextQuery.section = nextSection;
      } else {
        delete nextQuery.section;
      }

      router[method](
        {
          pathname: router.pathname,
          query: nextQuery,
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );

  useEffect(() => {
    if (!router.isReady) return;
    const sectionFromQuery =
      typeof router.query.section === "string" ? router.query.section : "general";
    const safeSection = validSectionIds.includes(sectionFromQuery)
      ? sectionFromQuery
      : "general";
    setSelectedSectionState((prev) => (prev === safeSection ? prev : safeSection));
  }, [router.isReady, router.query.section, validSectionIds]);

  const renderSelectedSection = () => {
    switch (selectedSection) {
      case "general": {
        return (
          <GeneralSection
            user={user}
            mode={mode}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }

      case "orders": {
        return (
          <OrdersSection
            user={user}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }

      case "provider_info": {
        return (
          <ProviderInfoSection
            provider={user?.provider}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }

      case "payouts": {
        return (
          <PayoutsSection
            user={user}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }

      case "client_orders": {
        return (
          <ClientOrdersSection
            user={user}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }

      case "payments": {
        return (
          <PaymentsSection
            user={user}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }

      case "booked_time_slots": {
        return (
          <BookedTimeSlotsSection
            periods={user?.provider?.unavailablePeriods}
            providerId={user?.provider?.id}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }

      case "messages": {
        return (
          <MessagesSection
            onBackClick={() => {
              setSelectedSection("");
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
            }}
          />
        );
      }

      case "badges": {
        const criminalStatus = (
          user.provider?.criminalRecord?.currentStatus ??
          user.provider?.criminalRecordStatus ??
          ""
        ).toUpperCase();
        return (
          <BadgesSection
            mode={mode}
            selectedBadges={user?.provider?.badgesIds ?? []}
            providerUserId={user.user.id}
            userId={user.user.id}
            userIsVerified={user.user.isUserVerified}
            isProviderCriminalRecordVerified={criminalStatus === "APPROVED"}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }

      case "documents": {
        return (
          <DocumentsSection
            documents={user.documents}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }

      case "special_skills": {
        return (
          <SpecialSkillsSection
            specialSkills={user?.provider?.specialSkills}
            providerId={user?.provider?.id}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }
      case "add_admin_review": {
        return (
          <AddAdminReviewSection
            user={user}
            mode={mode}
            defaultOrderId={user?.orders?.lastOrder?.id}
            onBackClick={() => {
              setSelectedSection("");
            }}
          />
        );
      }
    }
  };

  return (
    <div className={styles.main}>
      <ProfileMenu
        user={user}
        setIsSelectedMenu={() => {}}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        mode={mode}
      />
      <div className={styles.sectionWrapper}>{renderSelectedSection()}</div>
    </div>
  );
};

export default DetailedClient;
