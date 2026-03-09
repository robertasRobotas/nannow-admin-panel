/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useCallback } from "react";
import SearchBar from "../SearchBar/SearchBar";
import DropDownButton from "../DropDownButton/DropDownButton";
import Cards from "./Cards/Cards";
import styles from "./users.module.css";
import axios from "axios";
import { getAllUsers, getNotFinishedOnboardingUsers } from "@/pages/api/fetch";
import { useRouter } from "next/router";
import paginateStyles from "../../styles/paginate.module.css";
import ReactPaginate from "react-paginate";
import { User } from "@/types/Client";
import {
  GetOnboardingNotFinishedUsersResponse,
  OnboardingNotFinishedUser,
  OnboardingMode,
  OnboardingStep,
} from "@/types/OnboardingUser";
import defaultUserImg from "@/assets/images/default-avatar.png";

const onboardingStepLabels: Record<OnboardingStep, string> = {
  USER_VERIFIED: "User verified",
  PROFILE_PICTURE: "Profile picture",
  ADDRESS: "Address",
  CHILD: "Child",
  ABOUT_ME: "About me",
  CRIMINAL_RECORD: "Criminal record",
  BANK_ONBOARDING: "Bank onboarding",
  KYC: "KYC",
};

const formatRemainingSteps = (steps: OnboardingStep[]) =>
  steps
    .map((step) => onboardingStepLabels[step] ?? step)
    .join(", ");

type UsersViewMode =
  | "CLIENTS"
  | "PROVIDERS"
  | "ONBOARDING_CLIENTS"
  | "ONBOARDING_PROVIDERS";
type UsersViewOption = {
  title: string;
  value: UsersViewMode;
  attentionNumber?: number;
};

const Users = () => {
  const [selectedViewOption, setSelectedViewOption] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [onboardingUsers, setOnboardingUsers] = useState<
    OnboardingNotFinishedUser[]
  >([]);
  const router = useRouter();

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [pageCount, setPageCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [clientOnboardingCount, setClientOnboardingCount] = useState(0);
  const [providerOnboardingCount, setProviderOnboardingCount] = useState(0);
  const [modeReady, setModeReady] = useState(false);

  const viewOptions: UsersViewOption[] = [
    { title: "Clients", value: "CLIENTS" },
    { title: "Providers", value: "PROVIDERS" },
    {
      title: "Clients with not finished onboarding",
      value: "ONBOARDING_CLIENTS",
      attentionNumber: clientOnboardingCount,
    },
    {
      title: "Providers with not finished onboarding",
      value: "ONBOARDING_PROVIDERS",
      attentionNumber: providerOnboardingCount,
    },
  ] as const;
  const currentView = viewOptions[selectedViewOption]?.value as UsersViewMode;
  const isOnboardingSelected =
    currentView === "ONBOARDING_CLIENTS" ||
    currentView === "ONBOARDING_PROVIDERS";
  const isSelectedClients = currentView === "CLIENTS";

  // Sync selected mode with URL query (?mode=clients|providers)
  useEffect(() => {
    if (!router.isReady) return;
    const mode =
      typeof router.query.mode === "string" ? router.query.mode : undefined;
    if (mode === "providers") {
      setSelectedViewOption(1);
    } else {
      // default to clients
      setSelectedViewOption(0);
    }
    setModeReady(true);
  }, [router.isReady, router.query.mode]);

  const fetchOnboardingNotFinishedCount = useCallback(async () => {
    try {
      const [clientResponse, providerResponse] = await Promise.all([
        getNotFinishedOnboardingUsers({ mode: "CLIENT", pageSize: 1 }),
        getNotFinishedOnboardingUsers({ mode: "PROVIDER", pageSize: 1 }),
      ]);

      const clientPayload = clientResponse.data as
        | GetOnboardingNotFinishedUsersResponse
        | { result?: GetOnboardingNotFinishedUsersResponse };
      const clientResult =
        (
          clientPayload as { result?: GetOnboardingNotFinishedUsersResponse }
        ).result ?? (clientPayload as GetOnboardingNotFinishedUsersResponse);

      const providerPayload = providerResponse.data as
        | GetOnboardingNotFinishedUsersResponse
        | { result?: GetOnboardingNotFinishedUsersResponse };
      const providerResult =
        (
          providerPayload as { result?: GetOnboardingNotFinishedUsersResponse }
        ).result ?? (providerPayload as GetOnboardingNotFinishedUsersResponse);

      setClientOnboardingCount(Number(clientResult.total ?? 0));
      setProviderOnboardingCount(Number(providerResult.total ?? 0));
    } catch (err) {
      console.log(err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setUsers([]);
      const url = isSelectedClients
        ? `admin/users?type=client&startIndex=${itemOffset}&search=${searchText}`
        : `admin/users?type=provider&startIndex=${itemOffset}&search=${searchText}`;
      const response = await getAllUsers(url);
      setUsers(response.data.users.items);
      setItemsPerPage(response.data.users.pageSize);
      setPageCount(
        Math.ceil(response.data.users.total / response.data.users.pageSize),
      );
      setTotalUsers(response.data.users.total);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [isSelectedClients, itemOffset, router, searchText]);

  const fetchOnboardingUsers = useCallback(async () => {
    try {
      setOnboardingUsers([]);
      const mode: OnboardingMode | undefined =
        currentView === "ONBOARDING_CLIENTS"
          ? "CLIENT"
          : currentView === "ONBOARDING_PROVIDERS"
            ? "PROVIDER"
            : undefined;
      const response = await getNotFinishedOnboardingUsers({
        startIndex: itemOffset,
        pageSize: itemsPerPage,
        search: searchText || undefined,
        mode,
      });
      const payload = response.data as
        | GetOnboardingNotFinishedUsersResponse
        | { result?: GetOnboardingNotFinishedUsersResponse };
      const result =
        (payload as { result?: GetOnboardingNotFinishedUsersResponse }).result ??
        (payload as GetOnboardingNotFinishedUsersResponse);
      const items = Array.isArray(result.items) ? result.items : [];
      const pageSize = Number(result.pageSize ?? itemsPerPage);
      const total = Number(result.total ?? 0);
      setOnboardingUsers(items);
      setItemsPerPage(pageSize > 0 ? pageSize : 20);
      setPageCount(Math.ceil(total / (pageSize > 0 ? pageSize : 20)));
      setTotalUsers(total);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [currentView, itemOffset, itemsPerPage, router, searchText]);

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * (itemsPerPage ?? 0)) % totalUsers;
    setItemOffset(newOffset);
  };

  useEffect(() => {
    fetchOnboardingNotFinishedCount();
  }, [fetchOnboardingNotFinishedCount]);

  useEffect(() => {
    if (!router.isReady || !modeReady) return;
    if (isOnboardingSelected) {
      fetchOnboardingUsers();
      return;
    }
    fetchUsers();
  }, [
    router.isReady,
    modeReady,
    currentView,
    isOnboardingSelected,
    itemOffset,
    fetchOnboardingUsers,
    fetchUsers,
  ]);

  const openOnboardingUserProfile = (user: OnboardingNotFinishedUser) => {
    const normalizedMode = String(user.currentMode ?? "").toUpperCase();
    router.push(
      normalizedMode === "PROVIDER"
        ? `/provider/${user.userId}`
        : `/client/${user.userId}`,
    );
  };

  return (
    <div className={styles.main}>
      <div className={styles.heading}>
        <div className={styles.headingLeftSide}>
          <DropDownButton
            options={viewOptions.map((option) => ({
              title: option.title,
              value: option.value,
              attentionNumber: option.attentionNumber,
            }))}
            selectedOption={selectedViewOption}
            setSelectedOption={setSelectedViewOption}
            onClickOption={() => {
              setItemOffset(0);
            }}
          />
        </div>
        <div>
          <SearchBar
            searchText={searchText}
            setSearchText={setSearchText}
            placeholder="Type username, ID  or email"
            onButtonClick={() => {
              setItemOffset(0);
              if (isOnboardingSelected) {
                fetchOnboardingUsers();
              } else {
                fetchUsers();
              }
            }}
          />
        </div>
      </div>

      {isOnboardingSelected ? (
        onboardingUsers.length > 0 ? (
          <div className={styles.onboardingList}>
            {onboardingUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className={styles.onboardingRow}
                onClick={() => openOnboardingUserProfile(user)}
              >
                <div className={styles.onboardingRowLeft}>
                  <img
                    className={styles.onboardingAvatar}
                    src={user.imgUrl || defaultUserImg.src}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                  <div>
                    <div className={styles.onboardingName}>
                      {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                        "Unknown user"}
                    </div>
                    <div className={styles.onboardingMeta}>
                      {user.email || "—"}
                    </div>
                    <div className={styles.onboardingMeta}>
                      {user.currentMode} • {user.userId}
                    </div>
                  </div>
                </div>
                <div className={styles.onboardingRight}>
                  <div className={styles.stepsTitle}>
                    Remaining steps: {user.remainingStepsCount}
                  </div>
                  <div className={styles.stepsText}>
                    {formatRemainingSteps(user.remainingSteps ?? [])}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            No users with unfinished onboarding
          </div>
        )
      ) : (
        <Cards users={users} mode={isSelectedClients ? "client" : "provider"} />
      )}

      <ReactPaginate
        breakLabel="..."
        nextLabel=""
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={pageCount}
        previousLabel=""
        renderOnZeroPageCount={null}
        containerClassName={paginateStyles.paginateWrapper}
        pageClassName={paginateStyles.pageBtn}
        pageLinkClassName={paginateStyles.pageLink}
        activeClassName={paginateStyles.activePage}
        nextClassName={paginateStyles.nextPageBtn}
        nextLinkClassName={paginateStyles.nextLink}
        previousClassName={paginateStyles.prevPageBtn}
        previousLinkClassName={paginateStyles.prevLink}
        breakClassName={paginateStyles.break}
      />
    </div>
  );
};

export default Users;
