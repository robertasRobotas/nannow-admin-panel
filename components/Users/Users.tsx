/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useCallback } from "react";
import Button from "../Button/Button";
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

const onboardingModeOptions = [
  { title: "All", value: "" },
  { title: "Client", value: "CLIENT" },
  { title: "Provider", value: "PROVIDER" },
];

const Users = () => {
  const [isSelectedClients, setSelectedClients] = useState(true);
  const [isOnboardingSelected, setOnboardingSelected] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [onboardingUsers, setOnboardingUsers] = useState<
    OnboardingNotFinishedUser[]
  >([]);
  const [selectedOnboardingModeOption, setSelectedOnboardingModeOption] =
    useState(0);
  const router = useRouter();

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [pageCount, setPageCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [onboardingNotFinishedCount, setOnboardingNotFinishedCount] =
    useState(0);
  const [modeReady, setModeReady] = useState(false);

  // Sync selected mode with URL query (?mode=clients|providers)
  useEffect(() => {
    if (!router.isReady) return;
    const mode =
      typeof router.query.mode === "string" ? router.query.mode : undefined;
    if (mode === "providers") {
      setSelectedClients(false);
    } else {
      // default to clients
      setSelectedClients(true);
    }
    setModeReady(true);
  }, [router.isReady, router.query.mode, isSelectedClients]);

  const fetchOnboardingNotFinishedCount = useCallback(async () => {
    try {
      const response = await getNotFinishedOnboardingUsers({ pageSize: 1 });
      const payload = response.data as
        | GetOnboardingNotFinishedUsersResponse
        | { result?: GetOnboardingNotFinishedUsersResponse };
      const result =
        (payload as { result?: GetOnboardingNotFinishedUsersResponse }).result ??
        (payload as GetOnboardingNotFinishedUsersResponse);
      setOnboardingNotFinishedCount(Number(result.total ?? 0));
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
      const response = await getNotFinishedOnboardingUsers({
        startIndex: itemOffset,
        pageSize: itemsPerPage,
        search: searchText || undefined,
        mode:
          (onboardingModeOptions[selectedOnboardingModeOption]
            ?.value as "CLIENT" | "PROVIDER" | "") || undefined,
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
  }, [itemOffset, itemsPerPage, router, searchText, selectedOnboardingModeOption]);

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
    isSelectedClients,
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
          <Button
            onClick={() => {
              setSelectedClients(true);
              setOnboardingSelected(false);
              setItemOffset(0);
              router.replace(
                {
                  pathname: router.pathname,
                  query: { ...router.query, mode: "clients" },
                },
                undefined,
                { shallow: true },
              );
            }}
            title="Clients"
            type="PLAIN"
            isSelected={isSelectedClients}
          />
          <Button
            onClick={() => {
              setSelectedClients(false);
              setOnboardingSelected(false);
              setItemOffset(0);
              router.replace(
                {
                  pathname: router.pathname,
                  query: { ...router.query, mode: "providers" },
                },
                undefined,
                { shallow: true },
              );
            }}
            title="Providers"
            type="PLAIN"
            isSelected={!isSelectedClients}
          />
          {onboardingNotFinishedCount > 0 && (
            <div className={styles.onboardingBtnWrap}>
              <Button
                onClick={() => {
                  setOnboardingSelected(true);
                  setItemOffset(0);
                }}
                title="Onboarding not finished"
                type="PLAIN"
                isSelected={isOnboardingSelected}
                attentionNumber={onboardingNotFinishedCount}
              />
            </div>
          )}
          {isOnboardingSelected && (
            <DropDownButton
              options={onboardingModeOptions}
              selectedOption={selectedOnboardingModeOption}
              setSelectedOption={setSelectedOnboardingModeOption}
              onClickOption={() => {
                setItemOffset(0);
              }}
            />
          )}
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
