import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  CalendarClock,
  CircleCheck,
  CircleX,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";
import {
  getOrderSchedule,
  getOrderSchedules,
  type OrderScheduleItem,
  type OrderScheduleListResponse,
} from "@/pages/api/fetch";
import defaultUserImg from "@/assets/images/default-avatar.png";
import styles from "./schedule.module.css";

const PAGE_SIZE_OPTIONS = [100, 200, 500] as const;
const PERIOD_OPTIONS = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
] as const;

type PeriodPreset = (typeof PERIOD_OPTIONS)[number]["value"];

type ScheduleFilterState = {
  period: PeriodPreset;
  date: string;
  dateFrom: string;
  dateTo: string;
  year: string;
  month: string;
  timezone: string;
  status: string;
  clientUserId: string;
  providerUserId: string;
  showCanceled: boolean;
  showPast: boolean;
  page: number;
  pageSize: number;
};

type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: OrderScheduleItem[];
};

type ScheduleVisualStatus =
  | "future"
  | "running"
  | "finished"
  | "overdue"
  | "canceled";

const TIMEZONE = "Europe/Vilnius";
const SCHEDULE_VISIBILITY_STORAGE_KEY = "schedule-visibility-filters";
const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;
const HOUR_LABELS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, index) => DAY_START_HOUR + index,
);

const SCHEDULE_STATUS_META = {
  future: {
    label: "Future",
    legendLabel: "Future",
    color: "#2563eb",
    background: "#eaf2ff",
    Icon: CalendarClock,
  },
  running: {
    label: "Running",
    legendLabel: "Running now",
    color: "#b45309",
    background: "#fff4d6",
    Icon: LoaderCircle,
  },
  finished: {
    label: "Finished",
    legendLabel: "Finished",
    color: "#16803c",
    background: "#e6f4ea",
    Icon: CircleCheck,
  },
  overdue: {
    label: "Overdue / unfinished",
    legendLabel: "Overdue / unfinished",
    color: "#c5221f",
    background: "#fce8e6",
    Icon: TriangleAlert,
  },
  canceled: {
    label: "Canceled",
    legendLabel: "Canceled",
    color: "#5f6368",
    background: "#eef0f2",
    Icon: CircleX,
  },
} as const;

const SCHEDULE_STATUS_LEGEND: ScheduleVisualStatus[] = [
  "future",
  "running",
  "finished",
  "overdue",
  "canceled",
];

const pad = (value: number) => String(value).padStart(2, "0");

const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const todayInput = () => toDateInput(new Date());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date: Date) => addDays(date, -date.getDay());

const getWeekRange = (dateInputValue: string) => {
  const selected = new Date(`${dateInputValue}T00:00:00`);
  const start = startOfWeek(selected);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
};

const currentMonthState = (): Pick<
  ScheduleFilterState,
  "date" | "dateFrom" | "dateTo" | "year" | "month"
> => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    date: todayInput(),
    dateFrom: toDateInput(firstDay),
    dateTo: toDateInput(lastDay),
    year: String(now.getFullYear()),
    month: pad(now.getMonth() + 1),
  };
};

const getDefaultFilters = (): ScheduleFilterState => ({
  period: "month",
  ...currentMonthState(),
  timezone: TIMEZONE,
  status: "",
  clientUserId: "",
  providerUserId: "",
  showCanceled: false,
  showPast: true,
  page: 1,
  pageSize: 500,
});

const getSavedVisibilityFilters = (): Pick<
  ScheduleFilterState,
  "showCanceled" | "showPast"
> | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(SCHEDULE_VISIBILITY_STORAGE_KEY) ?? "null",
    ) as Partial<Pick<ScheduleFilterState, "showCanceled" | "showPast">> | null;
    if (!saved || typeof saved !== "object") return null;
    return {
      showCanceled:
        typeof saved.showCanceled === "boolean" ? saved.showCanceled : false,
      showPast: typeof saved.showPast === "boolean" ? saved.showPast : true,
    };
  } catch {
    return null;
  }
};

const saveVisibilityFilters = (
  filters: Pick<ScheduleFilterState, "showCanceled" | "showPast">,
) => {
  try {
    window.localStorage.setItem(
      SCHEDULE_VISIBILITY_STORAGE_KEY,
      JSON.stringify(filters),
    );
  } catch {
    // The schedule remains usable when browser storage is unavailable.
  }
};

const getFiltersForPeriod = (
  period: PeriodPreset,
  current: ScheduleFilterState,
): ScheduleFilterState => {
  if (period === "day" || period === "week") {
    return {
      ...current,
      period,
      page: 1,
    };
  }

  if (period === "month") {
    const year = Number(current.year) || new Date().getFullYear();
    const month = Number(current.month) || new Date().getMonth() + 1;
    return {
      ...current,
      period,
      dateFrom: toDateInput(new Date(year, month - 1, 1)),
      dateTo: toDateInput(new Date(year, month, 0)),
      page: 1,
    };
  }

  return {
    ...current,
    period,
    page: 1,
  };
};

const formatDateTime = (value?: string | null, timeZone = TIMEZONE) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone,
      }).format(new Date(value))
    : "-";

const formatEventTime = (value?: string | null, timeZone = TIMEZONE) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone,
      }).format(new Date(value))
    : "-";

const formatEventTimeRange = (
  startsAt?: string | null,
  endsAt?: string | null,
  timeZone = TIMEZONE,
) =>
  `${formatEventTime(startsAt, timeZone)} - ${formatEventTime(endsAt, timeZone)}`;

const formatMoney = (value?: number | null) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
};

const getScheduleId = (item: OrderScheduleItem) => item.orderId;

const getScheduleTitle = (item: OrderScheduleItem) =>
  item.orderPrettyId?.trim() || item.orderId;

const getScheduleParticipantName = (snapshot: OrderScheduleItem["client"]) => {
  const fullName = String(snapshot.fullName ?? "").trim();
  if (fullName) return fullName;
  return (
    `${String(snapshot.firstName ?? "").trim()} ${String(snapshot.lastName ?? "").trim()}`.trim() ||
    snapshot.profileId ||
    snapshot.userId
  );
};

const getScheduleDisplayText = (item: OrderScheduleItem, timeZone: string) =>
  `${formatEventTimeRange(item.startsAt, item.endsAt, timeZone)} ${getScheduleParticipantName(
    item.provider,
  )} / ${getScheduleParticipantName(item.client)}`;

const getScheduleVisualStatus = (
  item: OrderScheduleItem,
  now = Date.now(),
): ScheduleVisualStatus => {
  const normalized = String(item.status ?? "").toUpperCase();

  if (normalized.includes("CANCEL")) return "canceled";
  if (
    normalized.includes("NOT_STARTED_IN_TIME") ||
    normalized.includes("NOT_ENDED_IN_TIME")
  ) {
    return "overdue";
  }
  if (
    item.finishedAt ||
    normalized.includes("SERVICE_ENDED") ||
    normalized.includes("FINISH") ||
    normalized.includes("COMPLETED")
  ) {
    return "finished";
  }
  if (normalized.includes("SERVICE_IN_PROGRESS")) return "running";

  const startsAt = new Date(item.startsAt).getTime();
  const endsAt = new Date(item.endsAt).getTime();
  if (Number.isFinite(startsAt) && now < startsAt) return "future";
  if (Number.isFinite(endsAt) && now > endsAt) return "overdue";
  if (
    Number.isFinite(startsAt) &&
    Number.isFinite(endsAt) &&
    now >= startsAt &&
    now <= endsAt
  ) {
    return "running";
  }
  return "future";
};

const getScheduleVisualStyle = (item: OrderScheduleItem): CSSProperties => {
  const meta = SCHEDULE_STATUS_META[getScheduleVisualStatus(item)];
  return {
    "--event-color": meta.color,
    "--event-background": meta.background,
  } as CSSProperties;
};

const ScheduleStatusIcon = ({ item }: { item: OrderScheduleItem }) => {
  const status = getScheduleVisualStatus(item);
  const { Icon, label } = SCHEDULE_STATUS_META[status];
  return (
    <span
      className={`${styles.eventStatusIcon} ${
        status === "running" ? styles.statusIconRunning : ""
      }`}
      aria-label={label}
      title={label}
    >
      <Icon aria-hidden="true" />
    </span>
  );
};

const shouldShowScheduleItem = (
  item: OrderScheduleItem,
  filters: Pick<ScheduleFilterState, "showCanceled" | "showPast">,
) => {
  const normalizedStatus = String(item.status ?? "").toUpperCase();

  // The schedule is for actionable or completed bookings—not offers or orders
  // canceled before approval. Other canceled bookings remain behind the
  // dedicated visibility toggle.
  if (normalizedStatus === "CANCELED_NOT_PAID_BY_CLIENT") return false;
  if (normalizedStatus.includes("CANCEL")) return filters.showCanceled;

  const isEligibleStatus =
    normalizedStatus === "BOTH_APPROVED" ||
    normalizedStatus === "PROVIDER_ACCEPTED_DIRECT_OFFER" ||
    normalizedStatus === "PROVIDER_MARKED_AS_SERVICE_IN_PROGRESS" ||
    normalizedStatus === "PROVIDER_MARKED_AS_SERVICE_ENDED" ||
    normalizedStatus === "NOT_STARTED_IN_TIME" ||
    normalizedStatus === "NOT_ENDED_IN_TIME" ||
    Boolean(item.finishedAt);
  if (!isEligibleStatus) return false;

  if (!filters.showPast && new Date(item.startsAt).getTime() < Date.now()) {
    return false;
  }
  return true;
};

const getDateKey = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

const getLocalTimeParts = (value: string, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? 0),
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? 0),
  };
};

const groupItemsByDate = (items: OrderScheduleItem[], timeZone: string) => {
  const grouped = new Map<string, OrderScheduleItem[]>();
  items.forEach((item) => {
    const key = getDateKey(item.startsAt, timeZone);
    const current = grouped.get(key);
    if (current) current.push(item);
    else grouped.set(key, [item]);
  });
  grouped.forEach((dateItems) => {
    dateItems.sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  });
  return grouped;
};

const buildCalendarWeeks = (
  year: number,
  month: number,
  itemsByDate: Map<string, OrderScheduleItem[]>,
  timeZone: string,
): CalendarDay[][] => {
  const firstDay = new Date(year, month - 1, 1);
  const firstGridDay = new Date(firstDay);
  firstGridDay.setDate(firstDay.getDate() - firstDay.getDay());
  const todayKey = getDateKey(new Date().toISOString(), timeZone);

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(firstGridDay);
      date.setDate(firstGridDay.getDate() + weekIndex * 7 + dayIndex);
      const dateKey = toDateInput(date);
      return {
        date,
        dateKey,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month - 1,
        isToday: dateKey === todayKey,
        items: itemsByDate.get(dateKey) ?? [],
      };
    }),
  );
};

const buildMonthWeeks = (year: number, month: number) => {
  const firstDay = new Date(year, month - 1, 1);
  const firstGridDay = new Date(firstDay);
  firstGridDay.setDate(firstDay.getDate() - firstDay.getDay());
  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(firstGridDay);
      date.setDate(firstGridDay.getDate() + weekIndex * 7 + dayIndex);
      return date;
    }),
  );
};

const getTimedEventStyle = (
  item: OrderScheduleItem,
  timeZone: string,
): CSSProperties => {
  const start = getLocalTimeParts(item.startsAt, timeZone);
  const end = getLocalTimeParts(item.endsAt, timeZone);
  const startMinutes = Math.max(
    0,
    start.hour * 60 + start.minute - DAY_START_HOUR * 60,
  );
  const endMinutes = Math.max(
    startMinutes + 30,
    end.hour * 60 + end.minute - DAY_START_HOUR * 60,
  );
  const visibleMinutes = (DAY_END_HOUR - DAY_START_HOUR + 1) * 60;
  return {
    ...getScheduleVisualStyle(item),
    top: `${(startMinutes / visibleMinutes) * 100}%`,
    height: `${Math.max(3, ((endMinutes - startMinutes) / visibleMinutes) * 100)}%`,
  } as CSSProperties;
};

const getCalendarTitle = (filters: ScheduleFilterState) => {
  if (filters.period === "month") {
    return new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
    }).format(new Date(Number(filters.year), Number(filters.month) - 1, 1));
  }
  if (filters.period === "year") return filters.year;
  if (filters.period === "day") {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${filters.date}T00:00:00`));
  }
  const days = getWeekRange(filters.date);
  return `${new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
  }).format(days[0])} - ${new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(days[6])}`;
};

const Schedule = () => {
  const router = useRouter();
  const { lastEvent } = useAdminSocket();
  const [filters, setFilters] =
    useState<ScheduleFilterState>(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ScheduleFilterState>(getDefaultFilters);
  const [items, setItems] = useState<OrderScheduleItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedItem, setSelectedItem] = useState<OrderScheduleItem | null>(
    null,
  );
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [error, setError] = useState("");
  const [filtersReady, setFiltersReady] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const defaults = getDefaultFilters();
    const savedVisibility = getSavedVisibilityFilters();
    const { query } = router;
    const period =
      typeof query.period === "string" &&
      PERIOD_OPTIONS.some((option) => option.value === query.period)
        ? (query.period as PeriodPreset)
        : defaults.period;
    const pageSizeValue = Number(query.pageSize ?? defaults.pageSize);
    const pageSize = PAGE_SIZE_OPTIONS.includes(
      pageSizeValue as (typeof PAGE_SIZE_OPTIONS)[number],
    )
      ? pageSizeValue
      : defaults.pageSize;
    const startIndex =
      typeof query.startIndex === "string" ? Number(query.startIndex) : 0;
    const derivedPage =
      Number.isFinite(startIndex) && startIndex > 0
        ? Math.floor(startIndex / pageSize) + 1
        : defaults.page;
    const nextFilters: ScheduleFilterState = {
      ...defaults,
      period,
      date: typeof query.date === "string" ? query.date : defaults.date,
      dateFrom:
        typeof query.dateFrom === "string" ? query.dateFrom : defaults.dateFrom,
      dateTo: typeof query.dateTo === "string" ? query.dateTo : defaults.dateTo,
      year: typeof query.year === "string" ? query.year : defaults.year,
      month: typeof query.month === "string" ? query.month : defaults.month,
      timezone:
        typeof query.timezone === "string" ? query.timezone : defaults.timezone,
      status: typeof query.status === "string" ? query.status : defaults.status,
      clientUserId:
        typeof query.clientUserId === "string"
          ? query.clientUserId
          : defaults.clientUserId,
      providerUserId:
        typeof query.providerUserId === "string"
          ? query.providerUserId
          : defaults.providerUserId,
      showCanceled:
        typeof query.showCanceled === "string"
          ? query.showCanceled === "true"
          : (savedVisibility?.showCanceled ?? defaults.showCanceled),
      showPast:
        typeof query.showPast === "string"
          ? query.showPast === "true"
          : (savedVisibility?.showPast ?? defaults.showPast),
      page: derivedPage,
      pageSize,
    };

    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setFiltersReady(true);
  }, [
    router.isReady,
    router.query.clientUserId,
    router.query.date,
    router.query.dateFrom,
    router.query.dateTo,
    router.query.month,
    router.query.pageSize,
    router.query.period,
    router.query.providerUserId,
    router.query.showCanceled,
    router.query.showPast,
    router.query.startIndex,
    router.query.status,
    router.query.timezone,
    router.query.year,
  ]);

  useEffect(() => {
    if (!filtersReady) return;
    saveVisibilityFilters({
      showCanceled: appliedFilters.showCanceled,
      showPast: appliedFilters.showPast,
    });
  }, [
    appliedFilters.showCanceled,
    appliedFilters.showPast,
    filtersReady,
  ]);

  const fetchList = useCallback(async () => {
    try {
      setLoadingList(true);
      setError("");
      const response = await getOrderSchedules({
        period: appliedFilters.period,
        date:
          appliedFilters.period === "day" || appliedFilters.period === "week"
            ? appliedFilters.date
            : undefined,
        year:
          appliedFilters.period === "month" || appliedFilters.period === "year"
            ? appliedFilters.year
            : undefined,
        month:
          appliedFilters.period === "month" ? appliedFilters.month : undefined,
        timezone: appliedFilters.timezone || TIMEZONE,
        status: appliedFilters.status || undefined,
        clientUserId: appliedFilters.clientUserId || undefined,
        providerUserId: appliedFilters.providerUserId || undefined,
        showCanceled: appliedFilters.showCanceled,
        showPast: appliedFilters.showPast,
        startIndex: (appliedFilters.page - 1) * appliedFilters.pageSize,
        pageSize: appliedFilters.pageSize,
      });
      const payload = (response.data?.result ??
        response.data) as OrderScheduleListResponse;
      const nextItems = Array.isArray(payload.items) ? payload.items : [];
      const visibleItems = nextItems.filter((item) =>
        shouldShowScheduleItem(item, appliedFilters),
      );
      setItems(visibleItems);
      setTotal(visibleItems.length);
      if (visibleItems.length === 0) {
        setSelectedId("");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      setItems([]);
      setTotal(0);
      setSelectedId("");
      setError("Failed to load schedules.");
    } finally {
      setLoadingList(false);
    }
  }, [appliedFilters, router]);

  useEffect(() => {
    if (!router.isReady || !filtersReady) return;
    fetchList();
  }, [fetchList, filtersReady, router.isReady]);

  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type !== "ORDER_CONFIRMED" &&
      lastEvent.type !== "ORDER_CANCELED"
    ) {
      return;
    }

    let isCancelled = false;
    const refreshAffectedOrder = async () => {
      try {
        const response = await getOrderSchedule(lastEvent.orderId);
        const payload = (response.data?.result ?? response.data) as
          | OrderScheduleItem
          | { schedule?: OrderScheduleItem; orderSchedule?: OrderScheduleItem };
        const nextItem =
          (payload && "orderId" in payload ? payload : null) ??
          (payload && "schedule" in payload
            ? (payload.schedule ?? null)
            : null) ??
          (payload && "orderSchedule" in payload
            ? (payload.orderSchedule ?? null)
            : null);

        if (isCancelled) return;

        setItems((prev) => {
          const nextItems = [...prev];
          const existingIndex = nextItems.findIndex(
            (item) => item.orderId === lastEvent.orderId,
          );

          if (!nextItem || !shouldShowScheduleItem(nextItem, filters)) {
            if (existingIndex >= 0) {
              nextItems.splice(existingIndex, 1);
            }
            return nextItems;
          }

          if (existingIndex >= 0) {
            nextItems[existingIndex] = nextItem;
          } else {
            nextItems.push(nextItem);
          }

          nextItems.sort(
            (a, b) =>
              new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          );

          return nextItems;
        });

        if (selectedId === lastEvent.orderId) {
          if (!nextItem || !shouldShowScheduleItem(nextItem, filters)) {
            closeModal();
          } else {
            setSelectedItem(nextItem);
          }
        }
      } catch {
        if (isCancelled) return;
        if (lastEvent.type === "ORDER_CANCELED") {
          setItems((prev) =>
            prev.filter((item) => item.orderId !== lastEvent.orderId),
          );
          if (selectedId === lastEvent.orderId) {
            closeModal();
          }
        }
      }
    };

    void refreshAffectedOrder();

    return () => {
      isCancelled = true;
    };
  }, [filters, lastEvent, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedItem(null);
      return;
    }
    const fromList =
      items.find((item) => getScheduleId(item) === selectedId) ?? null;
    if (fromList) {
      setSelectedItem(fromList);
      setLoadingItem(false);
      return;
    }

    let isCancelled = false;
    const fetchDetail = async () => {
      try {
        setLoadingItem(true);
        const response = await getOrderSchedule(selectedId);
        const payload = (response.data?.result ?? response.data) as
          | OrderScheduleItem
          | { schedule?: OrderScheduleItem; orderSchedule?: OrderScheduleItem };
        const fallback =
          (payload && "orderId" in payload ? payload : null) ??
          (payload && "schedule" in payload
            ? (payload.schedule ?? null)
            : null) ??
          (payload && "orderSchedule" in payload
            ? (payload.orderSchedule ?? null)
            : null);
        if (!isCancelled) {
          setSelectedItem(fallback);
        }
      } catch {
        if (!isCancelled) setSelectedItem(null);
      } finally {
        if (!isCancelled) setLoadingItem(false);
      }
    };

    fetchDetail();

    return () => {
      isCancelled = true;
    };
  }, [items, selectedId]);

  const itemsByDate = useMemo(
    () => groupItemsByDate(items, appliedFilters.timezone || TIMEZONE),
    [appliedFilters.timezone, items],
  );

  const calendarWeeks = useMemo(
    () =>
      buildCalendarWeeks(
        Number(appliedFilters.year) || new Date().getFullYear(),
        Number(appliedFilters.month) || new Date().getMonth() + 1,
        itemsByDate,
        appliedFilters.timezone || TIMEZONE,
      ),
    [
      appliedFilters.month,
      appliedFilters.timezone,
      appliedFilters.year,
      itemsByDate,
    ],
  );

  const weekDays = useMemo(
    () => getWeekRange(appliedFilters.date),
    [appliedFilters.date],
  );

  const dayViewDays = useMemo(
    () => [new Date(`${appliedFilters.date}T00:00:00`)],
    [appliedFilters.date],
  );

  const yearMonths = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        label: new Intl.DateTimeFormat("en-GB", { month: "long" }).format(
          new Date(Number(appliedFilters.year), index, 1),
        ),
        weeks: buildMonthWeeks(Number(appliedFilters.year), index + 1),
      })),
    [appliedFilters.year],
  );

  const summary = useMemo(() => {
    const now = Date.now();
    const futureItems = items.filter(
      (item) => new Date(item.startsAt).getTime() >= now,
    );
    const active = futureItems.filter(
      (item) => item.isActiveForContactSharing,
    ).length;
    const direct = futureItems.filter(
      (item) => item.isDirectOrderToProvider,
    ).length;
    return { total: futureItems.length, active, direct };
  }, [items]);

  const applyFilters = (nextFilters = filters) => {
    const next = { ...nextFilters, page: 1 };
    setFilters(next);
    setAppliedFilters(next);
    setSelectedId("");
  };

  const updateDraft = (patch: Partial<ScheduleFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const changePeriod = (period: PeriodPreset) => {
    applyFilters(getFiltersForPeriod(period, filters));
  };

  const changeDate = (date: string) => {
    applyFilters({ ...filters, date, page: 1 });
  };

  const changeMonth = (month: string) => {
    applyFilters(
      getFiltersForPeriod("month", { ...filters, period: "month", month }),
    );
  };

  const changeYear = (year: string) => {
    applyFilters({ ...filters, year, page: 1 });
  };

  const shiftVisibleRange = (direction: -1 | 1) => {
    if (appliedFilters.period === "day") {
      changeDate(
        toDateInput(
          addDays(new Date(`${appliedFilters.date}T00:00:00`), direction),
        ),
      );
      return;
    }
    if (appliedFilters.period === "week") {
      changeDate(
        toDateInput(
          addDays(new Date(`${appliedFilters.date}T00:00:00`), direction * 7),
        ),
      );
      return;
    }
    if (appliedFilters.period === "month") {
      const date = new Date(
        Number(appliedFilters.year),
        Number(appliedFilters.month) - 1 + direction,
        1,
      );
      applyFilters(
        getFiltersForPeriod("month", {
          ...filters,
          period: "month",
          year: String(date.getFullYear()),
          month: pad(date.getMonth() + 1),
        }),
      );
      return;
    }
    applyFilters({
      ...filters,
      period: "year",
      year: String(
        (Number(appliedFilters.year) || new Date().getFullYear()) + direction,
      ),
      page: 1,
    });
  };

  const goToday = () => {
    applyFilters({
      ...filters,
      ...currentMonthState(),
      page: 1,
    });
  };

  const resetFilters = () => {
    applyFilters(getDefaultFilters());
  };

  const selectItem = (item: OrderScheduleItem) => {
    setSelectedId(getScheduleId(item));
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedId("");
    setSelectedItem(null);
  };

  const renderMonthEvent = (item: OrderScheduleItem) => {
    const visualStatus = getScheduleVisualStatus(item);
    const statusLabel = SCHEDULE_STATUS_META[visualStatus].label;
    const displayText = getScheduleDisplayText(
      item,
      appliedFilters.timezone,
    );
    return (
      <button
        key={item.orderId}
        type="button"
        className={styles.calendarEvent}
        style={getScheduleVisualStyle(item)}
        onClick={() => selectItem(item)}
        title={`${statusLabel} · ${displayText}`}
        aria-label={`${statusLabel}: ${displayText}`}
      >
        <ScheduleStatusIcon item={item} />
        <span className={styles.calendarEventText}>{displayText}</span>
      </button>
    );
  };

  const renderTimedGrid = (days: Date[]) => (
    <div
      className={styles.timedCalendar}
      style={{ "--days-count": days.length } as CSSProperties}
    >
      <div className={styles.timezoneColumn}>{appliedFilters.timezone}</div>
      <div className={styles.timedHeader}>
        {days.map((day) => {
          const key = toDateInput(day);
          const isToday = key === todayInput();
          return (
            <div key={key} className={styles.timedDayHeader}>
              <span>{WEEKDAY_LABELS[day.getDay()]}</span>
              <strong className={isToday ? styles.dayNumberToday : ""}>
                {day.getDate()}
              </strong>
            </div>
          );
        })}
      </div>
      <div className={styles.timeLabels}>
        {HOUR_LABELS.map((hour) => (
          <div key={hour}>{pad(hour)}:00</div>
        ))}
      </div>
      <div className={styles.timedBody}>
        {days.map((day) => {
          const key = toDateInput(day);
          return (
            <div key={key} className={styles.timedDayColumn}>
              {HOUR_LABELS.map((hour) => (
                <div key={hour} className={styles.hourLine} />
              ))}
              {(itemsByDate.get(key) ?? []).map((item) => (
                <button
                  key={item.orderId}
                  type="button"
                  className={styles.timedEvent}
                  style={getTimedEventStyle(item, appliedFilters.timezone)}
                  onClick={() => selectItem(item)}
                  title={`${SCHEDULE_STATUS_META[getScheduleVisualStatus(item)].label} · ${getScheduleDisplayText(item, appliedFilters.timezone)}`}
                >
                  <ScheduleStatusIcon item={item} />
                  <span className={styles.timedEventContent}>
                    <strong>
                      {getScheduleParticipantName(item.provider)} /{" "}
                      {getScheduleParticipantName(item.client)}
                    </strong>
                    <span>
                      {formatEventTimeRange(
                        item.startsAt,
                        item.endsAt,
                        appliedFilters.timezone,
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={styles.main}>
      <header className={styles.calendarToolbar}>
        <button type="button" className={styles.todayButton} onClick={goToday}>
          Today
        </button>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => shiftVisibleRange(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => shiftVisibleRange(1)}
        >
          ›
        </button>
        <h1>{getCalendarTitle(appliedFilters)}</h1>
        <div className={styles.toolbarSpacer} />
        <select
          className={styles.periodSelect}
          value={filters.period}
          onChange={(event) => changePeriod(event.target.value as PeriodPreset)}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.compactFilters}>
        <details>
          <summary>Filters</summary>
          <div className={styles.filterGrid}>
            <label className={styles.field}>
              <span>Timezone</span>
              <input
                type="text"
                value={filters.timezone}
                onChange={(event) =>
                  updateDraft({ timezone: event.target.value })
                }
                onBlur={() => applyFilters()}
              />
            </label>
            <label className={styles.field}>
              <span>Status</span>
              <input
                type="text"
                value={filters.status}
                onChange={(event) =>
                  updateDraft({ status: event.target.value })
                }
                onBlur={() => applyFilters()}
                placeholder="Optional status"
              />
            </label>
            <label className={styles.field}>
              <span>Client user ID</span>
              <input
                type="text"
                value={filters.clientUserId}
                onChange={(event) =>
                  updateDraft({ clientUserId: event.target.value })
                }
                onBlur={() => applyFilters()}
              />
            </label>
            <label className={styles.field}>
              <span>Provider user ID</span>
              <input
                type="text"
                value={filters.providerUserId}
                onChange={(event) =>
                  updateDraft({ providerUserId: event.target.value })
                }
                onBlur={() => applyFilters()}
              />
            </label>
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={filters.showCanceled}
                onChange={(event) =>
                  applyFilters({
                    ...filters,
                    showCanceled: event.target.checked,
                  })
                }
              />
              <span>Show canceled</span>
            </label>
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={filters.showPast}
                onChange={(event) =>
                  applyFilters({ ...filters, showPast: event.target.checked })
                }
              />
              <span>Show past</span>
            </label>
          </div>
        </details>

        <div className={styles.rangeControls}>
          <label className={styles.field}>
            <span>Date</span>
            <input
              type="date"
              value={filters.date}
              onChange={(event) => changeDate(event.target.value)}
              disabled={filters.period !== "day" && filters.period !== "week"}
            />
          </label>
          <label className={styles.field}>
            <span>Month / year</span>
            <div className={styles.inlineFields}>
              <input
                type="number"
                min="1"
                max="12"
                value={filters.month}
                onChange={(event) => changeMonth(event.target.value)}
                disabled={filters.period !== "month"}
              />
              <input
                type="number"
                min="2020"
                max="2100"
                value={filters.year}
                onChange={(event) => changeYear(event.target.value)}
                disabled={filters.period === "day" || filters.period === "week"}
              />
            </div>
          </label>
          <label className={styles.pageSizeField}>
            <span>Rows</span>
            <select
              value={filters.pageSize}
              onChange={(event) =>
                applyFilters({
                  ...filters,
                  pageSize: Number(event.target.value),
                })
              }
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={styles.resetButton}
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </section>

      <section className={styles.calendarPane}>
        <div className={styles.paneHeader}>
          <div>
            <h2>
              {summary.total} scheduled order{summary.total === 1 ? "" : "s"}
            </h2>
            <p>
              {summary.active} contact sharing · {summary.direct} direct orders
            </p>
          </div>
          <div
            className={styles.statusLegend}
            aria-label="Schedule status legend"
          >
            {SCHEDULE_STATUS_LEGEND.map((status) => {
              const { Icon, color, background, legendLabel } =
                SCHEDULE_STATUS_META[status];
              return (
                <span
                  key={status}
                  className={styles.legendItem}
                  style={
                    {
                      "--event-color": color,
                      "--event-background": background,
                    } as CSSProperties
                  }
                >
                  <span
                    className={`${styles.legendIcon} ${
                      status === "running" ? styles.statusIconRunning : ""
                    }`}
                  >
                    <Icon aria-hidden="true" />
                  </span>
                  {legendLabel}
                </span>
              );
            })}
          </div>
        </div>

        {loadingList && (
          <div className={styles.empty}>Loading schedule rows...</div>
        )}
        {!loadingList && items.length === 0 && (
          <div className={styles.empty}>No schedules found.</div>
        )}

        {appliedFilters.period === "month" && (
          <div className={styles.calendarShell}>
            <div className={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className={styles.weekdayCell}>
                  {label}
                </div>
              ))}
            </div>
            <div className={styles.monthGrid}>
              {calendarWeeks.flat().map((day) => (
                <div
                  key={day.dateKey}
                  className={`${styles.dayCell} ${
                    day.isCurrentMonth ? "" : styles.dayCellMuted
                  }`}
                >
                  <div className={styles.dayHeader}>
                    <span
                      className={`${styles.dayNumber} ${
                        day.isToday ? styles.dayNumberToday : ""
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                  <div className={styles.dayEvents}>
                    {day.items.slice(0, 4).map(renderMonthEvent)}
                    {day.items.length > 4 && (
                      <button
                        type="button"
                        className={styles.moreEvents}
                        onClick={() => selectItem(day.items[4])}
                      >
                        +{day.items.length - 4} more
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {appliedFilters.period === "week" && renderTimedGrid(weekDays)}
        {appliedFilters.period === "day" && renderTimedGrid(dayViewDays)}

        {appliedFilters.period === "year" && (
          <div className={styles.yearGrid}>
            {yearMonths.map((month) => (
              <div key={month.month} className={styles.yearMonth}>
                <h3>{month.label}</h3>
                <div className={styles.yearWeekdays}>
                  {WEEKDAY_LABELS.map((label) => (
                    <span key={label}>{label[0]}</span>
                  ))}
                </div>
                <div className={styles.yearDays}>
                  {month.weeks.flat().map((day) => {
                    const dateKey = toDateInput(day);
                    const dayItems = itemsByDate.get(dateKey) ?? [];
                    const isCurrentMonth = day.getMonth() === month.month - 1;
                    return (
                      <button
                        key={`${month.month}-${dateKey}`}
                        type="button"
                        className={`${styles.yearDay} ${
                          isCurrentMonth ? "" : styles.yearDayMuted
                        } ${dayItems.length > 0 ? styles.yearDayHasEvents : ""}`}
                        style={
                          dayItems[0]
                            ? getScheduleVisualStyle(dayItems[0])
                            : undefined
                        }
                        onClick={() => {
                          if (dayItems[0]) selectItem(dayItems[0]);
                        }}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedId && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalCard}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={closeModal}
            >
              ×
            </button>
            {loadingItem && <div className={styles.empty}>Loading...</div>}
            {selectedItem && (
              <>
                <Link
                  href={`/orders/${selectedItem.orderId}`}
                  className={styles.previewUsers}
                >
                  <div className={styles.previewAvatarGroup}>
                    <img
                      src={selectedItem.provider.imgUrl || defaultUserImg.src}
                      alt={getScheduleParticipantName(selectedItem.provider)}
                      className={styles.previewAvatarProvider}
                    />
                    <img
                      src={selectedItem.client.imgUrl || defaultUserImg.src}
                      alt={getScheduleParticipantName(selectedItem.client)}
                      className={styles.previewAvatarClient}
                    />
                  </div>
                  <div className={styles.previewUserText}>
                    <strong>
                      {getScheduleParticipantName(selectedItem.provider)} |{" "}
                      {getScheduleParticipantName(selectedItem.client)}
                    </strong>
                    <span>{selectedItem.requestingServiceCity || "-"}</span>
                  </div>
                </Link>
                <div className={styles.previewTitleRow}>
                  <h3>{getScheduleTitle(selectedItem)}</h3>
                  <span className={styles.statusPill}>
                    {selectedItem.status}
                  </span>
                </div>
                <div className={styles.modalMetaGrid}>
                  <div>
                    <span>Start</span>
                    <strong>
                      {formatDateTime(
                        selectedItem.startsAt,
                        appliedFilters.timezone,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>End</span>
                    <strong>
                      {formatDateTime(
                        selectedItem.endsAt,
                        appliedFilters.timezone,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Total cost</span>
                    <strong>{formatMoney(selectedItem.totalPrice)}</strong>
                  </div>
                  <div>
                    <span>Order status</span>
                    <strong>{selectedItem.status}</strong>
                  </div>
                </div>
                <Link
                  href={`/orders/${selectedItem.orderId}`}
                  className={styles.orderLink}
                >
                  Open order details
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
