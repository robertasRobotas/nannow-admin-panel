import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
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

const TIMEZONE = "Europe/Vilnius";
const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;
const HOUR_LABELS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, index) => DAY_START_HOUR + index,
);

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
    : "—";

const formatEventTime = (value?: string | null, timeZone = TIMEZONE) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone,
      }).format(new Date(value))
    : "—";

const formatEventTimeRange = (
  startsAt?: string | null,
  endsAt?: string | null,
  timeZone = TIMEZONE,
) => `${formatEventTime(startsAt, timeZone)} - ${formatEventTime(endsAt, timeZone)}`;

const formatMoney = (value?: number | null) => {
  if (typeof value !== "number") return "—";
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

const getStatusColor = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized.includes("CANCEL")) return "#d93025";
  if (normalized.includes("FINISH") || normalized.includes("COMPLETED")) return "#188038";
  if (normalized.includes("PAID") || normalized.includes("APPROVED")) return "#1a73e8";
  if (normalized.includes("PENDING") || normalized.includes("WAIT")) return "#f9ab00";
  if (normalized.includes("SPLIT")) return "#7e57c2";
  if (normalized.includes("NOT_ENDED")) return "#5f6368";
  return "#1a73e8";
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
    "--event-color": getStatusColor(item.status),
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
  const [filters, setFilters] = useState<ScheduleFilterState>(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ScheduleFilterState>(getDefaultFilters);
  const [items, setItems] = useState<OrderScheduleItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedItem, setSelectedItem] = useState<OrderScheduleItem | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [error, setError] = useState("");
  const [filtersReady, setFiltersReady] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const defaults = getDefaultFilters();
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
      timezone: typeof query.timezone === "string" ? query.timezone : defaults.timezone,
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
          : defaults.showCanceled,
      showPast:
        typeof query.showPast === "string" ? query.showPast === "true" : defaults.showPast,
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
        month: appliedFilters.period === "month" ? appliedFilters.month : undefined,
        timezone: appliedFilters.timezone || TIMEZONE,
        status: appliedFilters.status || undefined,
        clientUserId: appliedFilters.clientUserId || undefined,
        providerUserId: appliedFilters.providerUserId || undefined,
        showCanceled: appliedFilters.showCanceled,
        showPast: appliedFilters.showPast,
        startIndex: (appliedFilters.page - 1) * appliedFilters.pageSize,
        pageSize: appliedFilters.pageSize,
      });
      const payload = (response.data?.result ?? response.data) as OrderScheduleListResponse;
      const nextItems = Array.isArray(payload.items) ? payload.items : [];
      setItems(nextItems);
      setTotal(Number(payload.total ?? nextItems.length) || 0);
      if (nextItems.length === 0) {
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
    if (!selectedId) {
      setSelectedItem(null);
      return;
    }
    const fromList = items.find((item) => getScheduleId(item) === selectedId) ?? null;
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
          (payload && "schedule" in payload ? payload.schedule ?? null : null) ??
          (payload && "orderSchedule" in payload ? payload.orderSchedule ?? null : null);
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
    [appliedFilters.month, appliedFilters.timezone, appliedFilters.year, itemsByDate],
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
    const active = items.filter((item) => item.isActiveForContactSharing).length;
    const direct = items.filter((item) => item.isDirectOrderToProvider).length;
    return { active, direct };
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
    applyFilters(getFiltersForPeriod("month", { ...filters, period: "month", month }));
  };

  const changeYear = (year: string) => {
    applyFilters({ ...filters, year, page: 1 });
  };

  const shiftVisibleRange = (direction: -1 | 1) => {
    if (appliedFilters.period === "day") {
      changeDate(toDateInput(addDays(new Date(`${appliedFilters.date}T00:00:00`), direction)));
      return;
    }
    if (appliedFilters.period === "week") {
      changeDate(toDateInput(addDays(new Date(`${appliedFilters.date}T00:00:00`), direction * 7)));
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
      year: String((Number(appliedFilters.year) || new Date().getFullYear()) + direction),
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

  const renderMonthEvent = (item: OrderScheduleItem) => (
    <button
      key={item.orderId}
      type="button"
      className={styles.calendarEvent}
      style={{ "--event-color": getStatusColor(item.status) } as CSSProperties}
      onClick={() => selectItem(item)}
      title={getScheduleDisplayText(item, appliedFilters.timezone)}
    >
      <span className={styles.calendarEventText}>
        {getScheduleDisplayText(item, appliedFilters.timezone)}
      </span>
    </button>
  );

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
                >
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
                onChange={(event) => updateDraft({ timezone: event.target.value })}
                onBlur={() => applyFilters()}
              />
            </label>
            <label className={styles.field}>
              <span>Status</span>
              <input
                type="text"
                value={filters.status}
                onChange={(event) => updateDraft({ status: event.target.value })}
                onBlur={() => applyFilters()}
                placeholder="Optional status"
              />
            </label>
            <label className={styles.field}>
              <span>Client user ID</span>
              <input
                type="text"
                value={filters.clientUserId}
                onChange={(event) => updateDraft({ clientUserId: event.target.value })}
                onBlur={() => applyFilters()}
              />
            </label>
            <label className={styles.field}>
              <span>Provider user ID</span>
              <input
                type="text"
                value={filters.providerUserId}
                onChange={(event) => updateDraft({ providerUserId: event.target.value })}
                onBlur={() => applyFilters()}
              />
            </label>
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={filters.showCanceled}
                onChange={(event) =>
                  applyFilters({ ...filters, showCanceled: event.target.checked })
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
                applyFilters({ ...filters, pageSize: Number(event.target.value) })
              }
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className={styles.resetButton} onClick={resetFilters}>
            Reset
          </button>
        </div>
      </section>

      <section className={styles.calendarPane}>
        <div className={styles.paneHeader}>
          <div>
            <h2>{total} scheduled order{total === 1 ? "" : "s"}</h2>
            <p>
              {summary.active} contact sharing · {summary.direct} direct orders
            </p>
          </div>
        </div>

        {loadingList && <div className={styles.empty}>Loading schedule rows...</div>}
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
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={closeModal}>
              ×
            </button>
            {loadingItem && <div className={styles.empty}>Loading...</div>}
            {selectedItem && (
              <>
                <Link href={`/orders/${selectedItem.orderId}`} className={styles.previewUsers}>
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
                    <span>{selectedItem.requestingServiceCity || "—"}</span>
                  </div>
                </Link>
                <div className={styles.previewTitleRow}>
                  <h3>{getScheduleTitle(selectedItem)}</h3>
                  <span className={styles.statusPill}>{selectedItem.status}</span>
                </div>
                <div className={styles.modalMetaGrid}>
                  <div>
                    <span>Start</span>
                    <strong>
                      {formatDateTime(selectedItem.startsAt, appliedFilters.timezone)}
                    </strong>
                  </div>
                  <div>
                    <span>End</span>
                    <strong>
                      {formatDateTime(selectedItem.endsAt, appliedFilters.timezone)}
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
                <Link href={`/orders/${selectedItem.orderId}`} className={styles.orderLink}>
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
