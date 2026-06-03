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
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import Cards from "../Cards/Cards";
import { UserWithCompensationDetails } from "./compensationPreview";

const PAGE_SIZE_OPTIONS = [
  { title: "20 / page", value: "20" },
  { title: "50 / page", value: "50" },
  { title: "100 / page", value: "100" },
] as const;

const buildCompensationQuery = (page: number, searchText: string) => {
  const query: Record<string, string> = { page: String(page) };
  const trimmedSearch = searchText.trim();

  if (trimmedSearch.length > 0) {
    query.search = trimmedSearch;
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

  const fetchUsers = useCallback(
    async (nextPage: number, nextSearchText: string, nextItemsPerPage: number) => {
      try {
        setIsLoading(true);
        const startIndex = (Math.max(nextPage, 1) - 1) * nextItemsPerPage;
        const searchParams = new URLSearchParams({
          startIndex: String(startIndex),
          pageSize: String(nextItemsPerPage),
          hasRequestedCompensationInfoAt: "true",
        });

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
    const nextPage = Number.isFinite(pageFromQuery) && pageFromQuery > 0
      ? pageFromQuery
      : 1;
    setSearchText(searchFromQuery);
    setAppliedSearchText(searchFromQuery.trim());
    setPage(nextPage);
    void fetchUsers(nextPage, searchFromQuery, itemsPerPage);
  }, [
    fetchUsers,
    itemsPerPage,
    router.isReady,
    router.query.page,
    router.query.search,
  ]);

  const pageCount = useMemo(
    () => Math.ceil(totalUsers / itemsPerPage) || 0,
    [itemsPerPage, totalUsers],
  );

  const handlePageChange = (event: { selected: number }) => {
    const nextPage = event.selected + 1;
    setPage(nextPage);
    router.push(
      {
        pathname: router.pathname,
        query: buildCompensationQuery(nextPage, appliedSearchText),
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
                    query: buildCompensationQuery(1, nextSearch),
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
        <div className={styles.toolbarLeft} />
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
                  query: buildCompensationQuery(1, appliedSearchText),
                },
                undefined,
                { shallow: true, scroll: false },
              );
              void fetchUsers(1, appliedSearchText, nextItemsPerPage);
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
          <UsersList users={users} mode="client" showCompensationInfo />
        ) : (
          <Cards users={users} mode="client" showCompensationInfo />
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
