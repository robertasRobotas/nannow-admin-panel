import styles from "./bookedTimeSlotsSection.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { UserDetails } from "@/types/Client";
import React from "react";
import Link from "next/link";
import { deleteProviderBookingSlot } from "@/pages/api/fetch";

type Period = NonNullable<
  NonNullable<UserDetails["provider"]>["unavailablePeriods"]
>[number] & {
  _id?: string;
  startsAt: string | Date;
  endsAt: string | Date;
};

type BookedTimeSlotsSectionProps = {
  periods: Period[] | undefined;
  providerId: string | undefined;
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
  providerId,
  onBackClick,
}: BookedTimeSlotsSectionProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [zoneLabel, setZoneLabel] = React.useState<string>("");
  const now = new Date();
  const todayKey = toDateOnlyKey(now);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(
    null,
  );
  const [localPeriods, setLocalPeriods] = React.useState<Period[]>([]);

  React.useEffect(() => {
    setLocalPeriods(periods ?? []);
  }, [periods]);
  const openDeleteModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedOrderId(null);
  };

  const confirmDelete = async () => {
    if (!selectedOrderId) return;
    if (!providerId) {
      console.warn("providerId is undefined, cannot delete booking slot");
      closeDeleteModal();
      return;
    }

    try {
      await deleteProviderBookingSlot(providerId, selectedOrderId);

      setLocalPeriods((prev) =>
        prev.filter((p) => p.orderId !== selectedOrderId),
      );

      console.log("delete order", selectedOrderId);
    } finally {
      closeDeleteModal();
    }
  };

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

  const normalized = localPeriods
    .map((p) => ({
      ...p,
      startsAt: parseToDate(p.startsAt),
      endsAt: parseToDate(p.endsAt),
    }))
    .sort(
      (a, b) => (a.startsAt as Date).getTime() - (b.startsAt as Date).getTime(),
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
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
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
                      <div key={id} className={styles.itemRow}>
                        <div className={styles.item}>
                          <span
                            className={`${styles.timeRange} ${nunito.className}`}
                          >
                            {formatTime(starts)} - {formatTime(ends)}
                          </span>

                          {item.orderId && (
                            <Link
                              href={`/orders/${item.orderId}`}
                              className={styles.orderId}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              order: {item.orderId}
                            </Link>
                          )}
                        </div>

                        {state === "upcoming" && (
                          <Button
                            title="Delete"
                            type="DELETE"
                            onClick={() => openDeleteModal(item.orderId)}
                          />
                        )}
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
      {isDeleteModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Delete time slot?</h2>
            <p className={styles.confirmationBody}>
              Are you sure you want to delete this booked time slot? This action
              cannot be undone.
            </p>

            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeDeleteModal}
              />
              <Button title="Delete" type="DELETE" onClick={confirmDelete} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookedTimeSlotsSection;
