import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import ReactPaginate from "react-paginate";
import { User } from "@/types/Client";
import { getAllUsers, getClientById } from "@/pages/api/fetch";
import UsersList from "../UsersList/UsersList";
import { nunito } from "@/helpers/fonts";
import styles from "./compensationUsers.module.css";
import paginateStyles from "../../../styles/paginate.module.css";
import SearchBar from "@/components/SearchBar/SearchBar";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import Button from "@/components/Button/Button";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import Cards from "../Cards/Cards";
import { UserWithCompensationDetails } from "./compensationPreview";

const PAGE_SIZE_OPTIONS = [
  { title: "20 / page", value: "20" },
  { title: "50 / page", value: "50" },
  { title: "100 / page", value: "100" },
] as const;

const COMPENSATION_SORT_OPTIONS = [
  { title: "Newest", value: "newest" },
  { title: "Oldest", value: "oldest" },
] as const;

const buildCompensationQuery = (
  page: number,
  searchText: string,
  requestedCompensationInfoAtSort: string,
  showCompletedCompensationRequests: boolean,
) => {
  const query: Record<string, string> = { page: String(page) };
  const trimmedSearch = searchText.trim();

  if (trimmedSearch.length > 0) {
    query.search = trimmedSearch;
  }

  if (requestedCompensationInfoAtSort) {
    query.requestedCompensationInfoAtSort = requestedCompensationInfoAtSort;
  }

  if (showCompletedCompensationRequests) {
    query.showCompletedCompensationRequests = "true";
  }

  return query;
};

const CompensationUsers = () => {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithCompensationDetails[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isCompactView, setIsCompactView] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [showCompletedRequests, setShowCompletedRequests] = useState(false);

  const fetchUsers = useCallback(
    async (
      nextPage: number,
      nextSearchText: string,
      nextItemsPerPage: number,
      nextSort: string,
      nextShowCompletedRequests: boolean,
    ) => {
      try {
        setIsLoading(true);
        const startIndex = (Math.max(nextPage, 1) - 1) * nextItemsPerPage;
        const searchParams = new URLSearchParams({
          startIndex: String(startIndex),
          pageSize: String(nextItemsPerPage),
          hasRequestedCompensationInfoAt: "true",
          requestedCompensationInfoAtSort: nextSort,
        });

        if (nextShowCompletedRequests) {
          searchParams.set("showCompletedCompensationRequests", "true");
        }

        if (nextSearchText.trim().length > 0) {
          searchParams.set("search", nextSearchText.trim());
        }

        const response = await getAllUsers(
          `admin/users?type=client&${searchParams.toString()}`,
        );
        const items = Array.isArray(response.data?.users?.items)
          ? (response.data.users.items as User[])
          : [];
        const enrichedUsers = await Promise.all(
          items.map(async (user) => {
            try {
              const detailResponse = await getClientById(user.userId);
              const clientDetails =
                detailResponse.data?.clientDetails ??
                detailResponse.data?.client ??
                null;
              return {
                ...user,
                client: clientDetails?.client ?? undefined,
              };
            } catch (error) {
              console.log(error);
              return user;
            }
          }),
        );
        setUsers(enrichedUsers);
        setTotalUsers(Number(response.data?.users?.total ?? 0) || 0);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!router.isReady) return;

    const searchFromQuery =
      typeof router.query.search === "string" ? router.query.search : "";
    const pageFromQuery =
      typeof router.query.page === "string" ? Number(router.query.page) : 1;
    const sortFromQuery =
      router.query.requestedCompensationInfoAtSort === "oldest"
        ? "oldest"
        : "newest";
    const showCompletedFromQuery =
      router.query.showCompletedCompensationRequests === "true";
    const nextPage =
      Number.isFinite(pageFromQuery) && pageFromQuery > 0 ? pageFromQuery : 1;

    setSearchText(searchFromQuery);
    setAppliedSearchText(searchFromQuery.trim());
    setPage(nextPage);
    setSelectedSort(sortFromQuery);
    setShowCompletedRequests(showCompletedFromQuery);
  }, [
    router.isReady,
    router.query.page,
    router.query.requestedCompensationInfoAtSort,
    router.query.search,
    router.query.showCompletedCompensationRequests,
  ]);

  useEffect(() => {
    if (!router.isReady) return;

    const searchFromQuery =
      typeof router.query.search === "string" ? router.query.search : "";
    const pageFromQuery =
      typeof router.query.page === "string" ? Number(router.query.page) : 1;
    const queryPage =
      Number.isFinite(pageFromQuery) && pageFromQuery > 0 ? pageFromQuery : 1;
    const querySort =
      router.query.requestedCompensationInfoAtSort === "oldest"
        ? "oldest"
        : "newest";
    const queryShowCompleted =
      router.query.showCompletedCompensationRequests === "true";
    const querySearchText = searchFromQuery.trim();

    if (
      page !== queryPage ||
      appliedSearchText !== querySearchText ||
      selectedSort !== querySort ||
      showCompletedRequests !== queryShowCompleted
    ) {
      return;
    }

    void fetchUsers(
      page,
      appliedSearchText,
      itemsPerPage,
      selectedSort,
      showCompletedRequests,
    );
  }, [
    appliedSearchText,
    fetchUsers,
    itemsPerPage,
    page,
    router.isReady,
    router.query.page,
    router.query.requestedCompensationInfoAtSort,
    router.query.search,
    router.query.showCompletedCompensationRequests,
    selectedSort,
    showCompletedRequests,
  ]);

  const pageCount = useMemo(
    () => Math.ceil(totalUsers / itemsPerPage) || 0,
    [itemsPerPage, totalUsers],
  );

  const refreshUsers = useCallback(() => {
    void fetchUsers(
      page,
      appliedSearchText,
      itemsPerPage,
      selectedSort,
      showCompletedRequests,
    );
  }, [
    appliedSearchText,
    fetchUsers,
    itemsPerPage,
    page,
    selectedSort,
    showCompletedRequests,
  ]);

  const handlePageChange = (event: { selected: number }) => {
    const nextPage = event.selected + 1;
    setPage(nextPage);
    router.push(
      {
        pathname: router.pathname,
        query: buildCompensationQuery(
          nextPage,
          appliedSearchText,
          selectedSort,
          showCompletedRequests,
        ),
      },
      undefined,
      { shallow: true, scroll: false },
    );
  };

  return (
    <div className={styles.main}>
      <div className={styles.heading}>
        <div className={styles.pageHeroRow}>
          <div className={styles.pageHeroTitleWrap}>
            <h1 className={`${styles.title} ${nunito.className}`}>
              Compensation
            </h1>
            <span className={styles.count}>{totalUsers}</span>
          </div>
          <div className={styles.pageHeroSearch}>
            <SearchBar
              className={styles.pageHeroSearchBar}
              searchText={searchText}
              setSearchText={setSearchText}
              placeholder="Type username, ID  or email"
              onButtonClick={() => {
                const nextSearch = searchText.trim();
                setAppliedSearchText(nextSearch);
                setPage(1);
                router.push(
                  {
                    pathname: router.pathname,
                    query: buildCompensationQuery(
                      1,
                      nextSearch,
                      selectedSort,
                      showCompletedRequests,
                    ),
                  },
                  undefined,
                  { shallow: true, scroll: false },
                );
              }}
            />
          </div>
        </div>
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.toolbarLeft}>
          <div className={styles.sortControl}>
            <DropDownButton
              options={COMPENSATION_SORT_OPTIONS.map((option) => ({
                title: option.title,
                value: option.value,
              }))}
              selectedOption={Math.max(
                0,
                COMPENSATION_SORT_OPTIONS.findIndex(
                  (option) => option.value === selectedSort,
                ),
              )}
              setSelectedOption={(selectedOption) => {
                const option =
                  COMPENSATION_SORT_OPTIONS[selectedOption as number];
                if (!option) return;
                setSelectedSort(option.value);
                setPage(1);
                router.push(
                  {
                    pathname: router.pathname,
                    query: buildCompensationQuery(
                      1,
                      appliedSearchText,
                      option.value,
                      showCompletedRequests,
                    ),
                  },
                  undefined,
                  { shallow: true, scroll: false },
                );
              }}
            />
          </div>
          <Button
            title="Show completed"
            type="OUTLINED"
            isSelected={showCompletedRequests}
            className={
              showCompletedRequests
                ? "!border-neutral-900 !bg-neutral-900 !text-white hover:!bg-neutral-800"
                : "!border-neutral-200 !bg-white !text-neutral-900 hover:!bg-neutral-50"
            }
            onClick={() => {
              const nextShowCompletedRequests = !showCompletedRequests;
              setShowCompletedRequests(nextShowCompletedRequests);
              setPage(1);
              router.push(
                {
                  pathname: router.pathname,
                  query: buildCompensationQuery(
                    1,
                    appliedSearchText,
                    selectedSort,
                    nextShowCompletedRequests,
                  ),
                },
                undefined,
                { shallow: true, scroll: false },
              );
            }}
          />
        </div>
        <div className={styles.toolbarRight}>
          <DropDownButton
            options={PAGE_SIZE_OPTIONS.map((option) => ({
              title: option.title,
              value: option.value,
            }))}
            selectedOption={Math.max(
              0,
              PAGE_SIZE_OPTIONS.findIndex(
                (option) => Number(option.value) === itemsPerPage,
              ),
            )}
            setSelectedOption={(selectedOption) => {
              const option = PAGE_SIZE_OPTIONS[selectedOption as number];
              if (!option) return;
              const nextItemsPerPage = Number(option.value);
              setPage(1);
              setItemsPerPage(nextItemsPerPage);
              router.push(
                {
                  pathname: router.pathname,
                  query: buildCompensationQuery(
                    1,
                    appliedSearchText,
                    selectedSort,
                    showCompletedRequests,
                  ),
                },
                undefined,
                { shallow: true, scroll: false },
              );
            }}
          />
          <div className={styles.viewToggle} role="group" aria-label="Layout">
            <span
              aria-hidden
              className={cn(
                styles.viewToggleSlider,
                !isCompactView && styles.viewToggleSliderRight,
              )}
            />
            <button
              type="button"
              className={cn(
                styles.viewToggleBtn,
                isCompactView && styles.viewToggleBtnActive,
              )}
              onClick={() => setIsCompactView(true)}
              aria-pressed={isCompactView}
              aria-label="List view"
            >
              <List size={18} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              className={cn(
                styles.viewToggleBtn,
                !isCompactView && styles.viewToggleBtnActive,
              )}
              onClick={() => setIsCompactView(false)}
              aria-pressed={!isCompactView}
              aria-label="Grid view"
            >
              <LayoutGrid size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>Loading users...</div>
      ) : users.length > 0 ? (
        isCompactView ? (
          <UsersList
            users={users}
            mode="client"
            showCompensationInfo
            onCompensationRequestUpdated={refreshUsers}
          />
        ) : (
          <Cards
            users={users}
            mode="client"
            showCompensationInfo
            onCompensationRequestUpdated={refreshUsers}
          />
        )
      ) : (
        <div className={styles.emptyState}>
          No users with compensation requests
        </div>
      )}

      {pageCount > 1 && (
        <div className={styles.paginationDock}>
          <ReactPaginate
            breakLabel="..."
            nextLabel=""
            onPageChange={handlePageChange}
            pageRangeDisplayed={5}
            pageCount={pageCount}
            forcePage={Math.min(pageCount - 1, Math.max(page - 1, 0))}
            previousLabel=""
            renderOnZeroPageCount={null}
            containerClassName={`${paginateStyles.paginateWrapper} ${styles.pagination}`}
            pageClassName={paginateStyles.pageBtn}
            pageLinkClassName={paginateStyles.pageLink}
            activeClassName={paginateStyles.activePage}
            previousClassName={paginateStyles.prevPageBtn}
            previousLinkClassName={paginateStyles.prevLink}
            nextClassName={paginateStyles.nextPageBtn}
            nextLinkClassName={paginateStyles.nextLink}
            breakClassName={paginateStyles.break}
          />
        </div>
      )}
    </div>
  );
};

export default CompensationUsers;
