import styles from "./bookedTimeSlotsSection.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { UserDetails } from "@/types/Client";
import React from "react";

type Period = NonNullable<
  NonNullable<UserDetails["provider"]>["unavailablePeriods"]
>[number] & {
  _id?: string;
  startsAt: string | Date;
  endsAt: string | Date;
};

type BookedTimeSlotsSectionProps = {
  periods: Period[] | undefined;
  onBackClick: () => void;
};

function toDateOnlyKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateReadable(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function parseToDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

const BookedTimeSlotsSection = ({
  periods,
  onBackClick,
}: BookedTimeSlotsSectionProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [zoneLabel, setZoneLabel] = React.useState<string>("");
  const now = new Date();
  const todayKey = toDateOnlyKey(now);

  React.useEffect(() => {
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    const totalMinutesFromUTC = -tzOffsetMinutes; // positive for UTC+
    const sign = totalMinutesFromUTC >= 0 ? "+" : "-";
    const absMinutes = Math.abs(totalMinutesFromUTC);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    const offset =
      minutes === 0
        ? `${hours}`
        : `${hours}:${String(minutes).padStart(2, "0")}`;
    setZoneLabel(`GMT${sign}${offset} (UTC${sign}${offset})`);
  }, []);

  const normalized = (periods ?? [])
    .map((p) => ({
      ...p,
      startsAt: parseToDate(p.startsAt),
      endsAt: parseToDate(p.endsAt),
    }))
    .sort(
      (a, b) => (a.startsAt as Date).getTime() - (b.startsAt as Date).getTime()
    );

  const groups = normalized.reduce<
    Record<string, { date: Date; items: Period[] }>
  >((acc, p) => {
    const key = toDateOnlyKey(p.startsAt as Date);
    if (!acc[key]) {
      acc[key] = { date: p.startsAt as Date, items: [] };
    }
    acc[key].items.push(p);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groups).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const getGroupState = (key: string) => {
    if (key === todayKey) return "today";
    return key < todayKey ? "past" : "upcoming";
  };

  const stateLabel: Record<string, string> = {
    past: "Past",
    today: "Today",
    upcoming: "Upcoming",
  };

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>
        Booked time slots{zoneLabel ? ` — You view in ${zoneLabel}` : ""}
      </h3>
      <div className={styles.list}>
        {sortedGroupKeys.length === 0 ? (
          <div className={styles.empty}>No booked time slots</div>
        ) : (
          sortedGroupKeys.map((key) => {
            const group = groups[key];
            const state = getGroupState(key);
            const wrapperClass =
              state === "past"
                ? `${styles.group} ${styles.statePast}`
                : state === "today"
                ? `${styles.group} ${styles.stateToday}`
                : `${styles.group} ${styles.stateUpcoming}`;

            return (
              <div key={key} className={wrapperClass}>
                <div className={styles.groupHeader}>
                  <span className={`${styles.groupDate} ${nunito.className}`}>
                    {formatDateReadable(group.date)}
                  </span>
                  <span className={styles.groupBadge}>{stateLabel[state]}</span>
                </div>
                <div className={styles.groupContent}>
                  {group.items.map((item) => {
                    const starts = item.startsAt as Date;
                    const ends = item.endsAt as Date;
                    const id =
                      (item as Period)._id ??
                      `${item.orderId}-${(
                        item.startsAt as Date
                      ).toISOString()}`;
                    return (
                      <div key={id} className={styles.item}>
                        <span
                          className={`${styles.timeRange} ${nunito.className}`}
                        >
                          {formatTime(starts)} - {formatTime(ends)}
                        </span>
                        {item.orderId ? (
                          <span className={styles.orderId}>
                            order: {item.orderId}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
      {isMobile && (
        <div className={styles.backBtnWrapper}>
          <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        </div>
      )}
    </div>
  );
};

export default BookedTimeSlotsSection;
