/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useCallback } from "react";
import SearchBar from "../SearchBar/SearchBar";
import DropDownButton from "../DropDownButton/DropDownButton";
import Cards from "./Cards/Cards";
import styles from "./users.module.css";
import axios from "axios";
import {
  getAllUsers,
  getBannedUsers,
  getNotFinishedOnboardingUsers,
  setUserBanStatus,
} from "@/pages/api/fetch";
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
import { nunito } from "@/helpers/fonts";
import Button from "../Button/Button";

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

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

type UsersViewMode =
  | "CLIENTS"
  | "PROVIDERS"
  | "ONBOARDING_CLIENTS"
  | "ONBOARDING_PROVIDERS"
  | "BANNED_USERS";
type UsersViewOption = {
  title: string;
  value: UsersViewMode;
  attentionNumber?: number;
};
type BannedUser = {
  id: string;
  userId: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  bannedAt?: string;
  reason?: string;
  banReason?: string;
  userBanReason?: string;
  bannedReason?: string;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  userImgUrl?: string;
  userIsBanned?: boolean;
  currentMode?: "CLIENT" | "PROVIDER";
};

const Users = () => {
  const [selectedViewOption, setSelectedViewOption] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [onboardingUsers, setOnboardingUsers] = useState<
    OnboardingNotFinishedUser[]
  >([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const router = useRouter();

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [pageCount, setPageCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [clientOnboardingCount, setClientOnboardingCount] = useState(0);
  const [providerOnboardingCount, setProviderOnboardingCount] = useState(0);
  const [isBanConfirmModalOpen, setIsBanConfirmModalOpen] = useState(false);
  const [banTargetUser, setBanTargetUser] = useState<BannedUser | null>(null);
  const [isUpdatingBan, setIsUpdatingBan] = useState(false);
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
    {
      title: "Banned users",
      value: "BANNED_USERS",
    },
  ] as const;
  const currentView = viewOptions[selectedViewOption]?.value as UsersViewMode;
  const isOnboardingSelected =
    currentView === "ONBOARDING_CLIENTS" ||
    currentView === "ONBOARDING_PROVIDERS";
  const isBannedUsersSelected = currentView === "BANNED_USERS";
  const isSelectedClients = currentView === "CLIENTS";

  // Sync selected mode with URL query (?mode=clients|providers)
  useEffect(() => {
    if (!router.isReady) return;
    const view =
      typeof router.query.view === "string" ? router.query.view : undefined;
    if (view === "banned") {
      const bannedIndex = viewOptions.findIndex(
        (option) => option.value === "BANNED_USERS",
      );
      setSelectedViewOption(bannedIndex >= 0 ? bannedIndex : 0);
      setModeReady(true);
      return;
    }
    const mode =
      typeof router.query.mode === "string" ? router.query.mode : undefined;
    if (mode === "providers") {
      setSelectedViewOption(1);
    } else {
      // default to clients
      setSelectedViewOption(0);
    }
    setModeReady(true);
  }, [router.isReady, router.query.mode, router.query.view]);

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

  const fetchBannedUsers = useCallback(async () => {
    try {
      const response = await getBannedUsers({
        startIndex: itemOffset,
        pageSize: itemsPerPage || 20,
        search: searchText || undefined,
      });
      const result = response.data?.result ?? response.data ?? {};
      const items = Array.isArray(result.items) ? (result.items as BannedUser[]) : [];
      const nextPageSize = Number(result.pageSize ?? itemsPerPage ?? 20);
      const nextTotal = Number(result.total ?? 0);
      setBannedUsers(items);
      setItemsPerPage(nextPageSize > 0 ? nextPageSize : 20);
      setPageCount(Math.ceil(nextTotal / (nextPageSize > 0 ? nextPageSize : 20)));
      setTotalUsers(nextTotal);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [itemOffset, itemsPerPage, router, searchText]);

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
    if (isBannedUsersSelected) {
      fetchBannedUsers();
      return;
    }
    fetchUsers();
  }, [
    router.isReady,
    modeReady,
    currentView,
    isOnboardingSelected,
    isBannedUsersSelected,
    itemOffset,
    fetchBannedUsers,
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

  const openBanConfirmModal = (user: BannedUser) => {
    setBanTargetUser(user);
    setIsBanConfirmModalOpen(true);
  };

  const closeBanConfirmModal = () => {
    if (isUpdatingBan) return;
    setIsBanConfirmModalOpen(false);
    setBanTargetUser(null);
  };

  const confirmUnban = async () => {
    if (!banTargetUser?.userId || isUpdatingBan) return;
    try {
      setIsUpdatingBan(true);
      await setUserBanStatus(banTargetUser.userId, false);
      setIsBanConfirmModalOpen(false);
      setBanTargetUser(null);
      await Promise.all([fetchBannedUsers(), fetchUsers()]);
      await fetchOnboardingNotFinishedCount();
    } catch (err) {
      console.log(err);
    } finally {
      setIsUpdatingBan(false);
    }
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
              } else if (isBannedUsersSelected) {
                fetchBannedUsers();
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
      ) : isBannedUsersSelected ? (
        bannedUsers.length > 0 ? (
          <div className={styles.onboardingList}>
            {bannedUsers.map((user) => (
              <div key={user.id} className={styles.onboardingRow}>
                <div className={styles.onboardingRowLeft}>
                  <img
                    className={styles.onboardingAvatar}
                    src={user.userImgUrl || defaultUserImg.src}
                    alt={`${user.userFirstName ?? ""} ${user.userLastName ?? ""}`}
                  />
                  <div>
                    <div className={styles.onboardingName}>
                      {`${user.userFirstName ?? ""} ${user.userLastName ?? ""}`.trim() ||
                        "Unknown user"}
                    </div>
                    <div className={styles.onboardingMeta}>
                      {user.userEmail || user.email || "—"}
                    </div>
                    <div className={styles.onboardingMeta}>{user.userId}</div>
                    <div className={styles.onboardingMeta}>
                      {`Reason: ${
                        user.banReason ??
                        user.userBanReason ??
                        user.bannedReason ??
                        user.reason ??
                        "—"
                      }`}
                    </div>
                    <div className={styles.onboardingMeta}>
                      {`Banned at: ${formatDateTime(
                        user.bannedAt ?? user.updatedAt ?? user.createdAt,
                      )}`}
                    </div>
                  </div>
                </div>
                <div className={styles.bannedSwitchWrap}>
                  <button
                    type="button"
                    className={styles.suspendSwitch}
                    onClick={() => openBanConfirmModal(user)}
                  >
                    <span
                      className={`${styles.suspendSwitchUi} ${styles.suspendSwitchUiActive}`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>No banned users</div>
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

      {isBanConfirmModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Unban user?</h2>
            <p className={styles.confirmationBody}>
              This user will be removed from the banned users list.
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeBanConfirmModal}
                isDisabled={isUpdatingBan}
              />
              <Button
                title={isUpdatingBan ? "Saving..." : "Confirm"}
                type="BLACK"
                onClick={confirmUnban}
                isDisabled={isUpdatingBan}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
