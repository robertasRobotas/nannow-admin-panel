import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getAllUsers } from "@/pages/api/fetch";
import Button from "@/components/Button/Button";
import styles from "./nannyForecast.module.css";

const PAGE_SIZE = 250;
const DAY_MS = 24 * 60 * 60 * 1000;
const INACTIVE_DAYS = 5;
const HIDDEN_DAYS = 60;
const MAP_RADIUS_KM = 100000;
const VILNIUS_LATITUDE = 54.6872;
const VILNIUS_LONGITUDE = 25.2797;

type NannyForecastItem = {
  id: string;
  userId: string;
  isOnboardingFinished?: boolean;
  isAvailableStatus?: boolean;
  stripeAccountId?: string | null;
  isStripeOnboardingFinished?: boolean | null;
  kycStatus?: string | null;
  bankOnboardingStatus?: string | null;
  isBankKycFinished?: boolean | null;
  isStripePayoutsEnabled?: boolean | null;
  isStripeChargesEnabled?: boolean | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
};

type MapProvider = {
  id: string;
  userId: string;
};

type ProviderPage = {
  items?: NannyForecastItem[];
  total?: number;
  startIndex?: number;
  pageSize?: number;
  hasMore?: boolean;
};

type StatusRow = {
  label: string;
  value: number;
};

type StatusGroup = {
  label: string;
  rows: StatusRow[];
};

const normalizeStatus = (value?: string | null) => {
  const normalized = value?.trim().toUpperCase();
  return normalized || "UNKNOWN";
};

const formatStatusLabel = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());

const buildStatusRows = (values: string[], expectedStatuses: string[]) => {
  const counts = new Map<string, number>(
    expectedStatuses.map((status) => [status, 0]),
  );

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([status, value]) => ({
    label: formatStatusLabel(status),
    value,
  }));
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getEffectiveActivityDate = (nanny: NannyForecastItem) =>
  parseDate(nanny.lastLoginAt) ?? parseDate(nanny.createdAt);

const isOlderThan = (date: Date | null, cutoff: Date) =>
  date !== null && date.getTime() < cutoff.getTime();

const passesActivityRule = (nanny: NannyForecastItem, activityCutoff: Date) => {
  const lastLoginAt = parseDate(nanny.lastLoginAt);
  if (lastLoginAt) {
    return lastLoginAt.getTime() >= activityCutoff.getTime();
  }

  const createdAt = parseDate(nanny.createdAt);
  return createdAt !== null && createdAt.getTime() >= activityCutoff.getTime();
};

const NannyForecast = () => {
  const [nannies, setNannies] = useState<NannyForecastItem[]>([]);
  const [mapProviders, setMapProviders] = useState<MapProvider[]>([]);
  const [reportedTotal, setReportedTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const loadNannies = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const mapProvidersRequest = getAllUsers(
        `providers/find-providers-by-radius/public?radiusKm=${MAP_RADIUS_KM}&latitude=${VILNIUS_LATITUDE}&longitude=${VILNIUS_LONGITUDE}`,
      );
      const byId = new Map<string, NannyForecastItem>();
      let startIndex = 0;
      let total = 0;

      while (true) {
        const response = await getAllUsers(
          `admin/users?type=provider&startIndex=${startIndex}&pageSize=${PAGE_SIZE}`,
        );
        const page = (response.data?.users ?? {}) as ProviderPage;
        const items = Array.isArray(page.items) ? page.items : [];

        items.forEach((nanny) => {
          const key = nanny.id || nanny.userId;
          if (key) byId.set(key, nanny);
        });

        total = Number(page.total ?? total) || 0;
        startIndex += items.length;
        const hasMore =
          typeof page.hasMore === "boolean" ? page.hasMore : startIndex < total;

        if (!hasMore || items.length === 0) break;
      }

      const mapResponse = await mapProvidersRequest;
      const returnedMapProviders = Array.isArray(mapResponse.data)
        ? (mapResponse.data as MapProvider[])
        : [];
      const uniqueMapProviders = new Map<string, MapProvider>();
      returnedMapProviders.forEach((provider) => {
        const key = provider.id || provider.userId;
        if (key) uniqueMapProviders.set(key, provider);
      });

      setNannies(Array.from(byId.values()));
      setMapProviders(Array.from(uniqueMapProviders.values()));
      setReportedTotal(total);
      setRefreshedAt(new Date());
    } catch (loadError) {
      const message = axios.isAxiosError(loadError)
        ? (loadError.response?.data as { error?: string } | undefined)?.error
        : undefined;
      setError(message || "Could not load nanny forecast data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNannies();
  }, [loadNannies]);

  const forecast = useMemo(() => {
    const now = Date.now();
    const inactiveCutoff = new Date(now - INACTIVE_DAYS * DAY_MS);
    const hiddenCutoff = new Date(now - HIDDEN_DAYS * DAY_MS);
    const finished = nannies.filter(
      (nanny) => nanny.isOnboardingFinished === true,
    );
    const inactive60Days = finished.filter(
      (nanny) => !passesActivityRule(nanny, hiddenCutoff),
    );
    const inactive60DaysInSitterMode = inactive60Days.filter(
      (nanny) => nanny.isAvailableStatus === true,
    );
    const sitterModeAutoOff = finished.filter(
      (nanny) =>
        nanny.isAvailableStatus === true &&
        isOlderThan(parseDate(nanny.lastLoginAt), inactiveCutoff),
    );
    const unknownActivity = finished.filter(
      (nanny) => getEffectiveActivityDate(nanny) === null,
    );
    const detailsByProviderId = new Map<string, NannyForecastItem>();
    nannies.forEach((nanny) => {
      if (nanny.id) detailsByProviderId.set(nanny.id, nanny);
      if (nanny.userId) detailsByProviderId.set(nanny.userId, nanny);
    });
    const mapProviderDetails = mapProviders
      .map(
        (provider) =>
          detailsByProviderId.get(provider.id) ??
          detailsByProviderId.get(provider.userId),
      )
      .filter((provider): provider is NannyForecastItem => Boolean(provider));
    const stripeStatusGroups: StatusGroup[] = [
      {
        label: "Stripe account",
        rows: buildStatusRows(
          mapProviderDetails.map((provider) =>
            provider.stripeAccountId?.trim() ? "PRESENT" : "MISSING",
          ),
          ["PRESENT", "MISSING"],
        ),
      },
      {
        label: "Stripe onboarding",
        rows: buildStatusRows(
          mapProviderDetails.map((provider) =>
            provider.isStripeOnboardingFinished === true
              ? "FINISHED"
              : provider.isStripeOnboardingFinished === false
                ? "NOT_FINISHED"
                : "UNKNOWN",
          ),
          ["FINISHED", "NOT_FINISHED", "UNKNOWN"],
        ),
      },
      {
        label: "KYC status",
        rows: buildStatusRows(
          mapProviderDetails.map((provider) =>
            normalizeStatus(provider.kycStatus),
          ),
          ["VERIFIED", "PENDING", "REJECTED", "NOT_SUBMITTED", "UNKNOWN"],
        ),
      },
      {
        label: "Bank onboarding",
        rows: buildStatusRows(
          mapProviderDetails.map((provider) =>
            normalizeStatus(provider.bankOnboardingStatus),
          ),
          ["APPROVED", "PENDING", "REJECTED", "NOT_STARTED", "UNKNOWN"],
        ),
      },
      {
        label: "Bank KYC",
        rows: buildStatusRows(
          mapProviderDetails.map((provider) =>
            provider.isBankKycFinished === true
              ? "FINISHED"
              : provider.isBankKycFinished === false
                ? "NOT_FINISHED"
                : "UNKNOWN",
          ),
          ["FINISHED", "NOT_FINISHED", "UNKNOWN"],
        ),
      },
      {
        label: "Stripe payouts",
        rows: buildStatusRows(
          mapProviderDetails.map((provider) =>
            provider.isStripePayoutsEnabled === true
              ? "ENABLED"
              : provider.isStripePayoutsEnabled === false
                ? "DISABLED"
                : "UNKNOWN",
          ),
          ["ENABLED", "DISABLED", "UNKNOWN"],
        ),
      },
      {
        label: "Stripe charges",
        rows: buildStatusRows(
          mapProviderDetails.map((provider) =>
            provider.isStripeChargesEnabled === true
              ? "ENABLED"
              : provider.isStripeChargesEnabled === false
                ? "DISABLED"
                : "UNKNOWN",
          ),
          ["ENABLED", "DISABLED", "UNKNOWN"],
        ),
      },
    ];

    return {
      total: nannies.length,
      finished: finished.length,
      inactive60Days: inactive60Days.length,
      inactive60DaysInSitterMode: inactive60DaysInSitterMode.length,
      remainingAfter60Days: finished.length - inactive60Days.length,
      sitterModeAutoOff: sitterModeAutoOff.length,
      unknownActivity: unknownActivity.length,
      mapProviderCount: mapProviders.length,
      mapProvidersMissingDetails:
        mapProviders.length - mapProviderDetails.length,
      stripeStatusGroups,
    };
  }, [mapProviders, nannies]);

  const cards = [
    {
      label: "Total registered providers",
      value: forecast.total,
      detail: "Every registered provider account",
    },
    {
      label: "Finished onboarding",
      value: forecast.finished,
      detail:
        "Allowed to work; includes both fully completed and warning statuses",
    },
    {
      label: `Remaining after the ${HIDDEN_DAYS}-day rule`,
      value: forecast.remainingAfter60Days,
      detail: "Finished providers who pass the new activity rule",
    },
    {
      label: `Finished onboarding and inactive ${HIDDEN_DAYS}+ days`,
      value: forecast.inactive60Days,
      detail: `Will fail the new ${HIDDEN_DAYS}-day map activity rule`,
    },
    {
      label: `Inactive ${HIDDEN_DAYS}+ days and in sitter mode`,
      value: forecast.inactive60DaysInSitterMode,
      detail: `Subset of inactive providers whose sitter mode is still on`,
    },
  ];

  return (
    <section className={styles.root}>
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Activity forecast</p>
          <h1 className={styles.title}>Nanny visibility forecast</h1>
          <p className={styles.description}>
            Shows how the {INACTIVE_DAYS}-day sitter-mode rule and {HIDDEN_DAYS}
            -day map rule affect providers who are allowed to work.
          </p>
        </div>
        <Button
          title={isLoading ? "Loading…" : "Refresh"}
          type="OUTLINED"
          onClick={() => void loadNannies()}
          isDisabled={isLoading}
          isLoading={isLoading}
          className={styles.refreshButton}
        />
      </div>

      {error ? (
        <div className={styles.error} role="alert">
          <strong>Forecast unavailable</strong>
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <span>
              Loaded{" "}
              <strong>
                {nannies.length.toLocaleString()} of{" "}
                {reportedTotal.toLocaleString()}
              </strong>{" "}
              nannies
            </span>
            <span>
              {refreshedAt
                ? `Updated ${refreshedAt.toLocaleString()}`
                : "Loading current data…"}
            </span>
          </div>

          <div className={styles.grid} aria-busy={isLoading}>
            {cards.map((card) => (
              <article className={styles.card} key={card.label}>
                <p className={styles.cardLabel}>{card.label}</p>
                <strong className={styles.cardValue}>
                  {isLoading && nannies.length === 0
                    ? "—"
                    : card.value.toLocaleString()}
                </strong>
                <p className={styles.cardDetail}>{card.detail}</p>
              </article>
            ))}
          </div>

          <div className={styles.ruleNote}>
            <div>
              <strong>{INACTIVE_DAYS}-day sitter mode rule</strong>
              <p>
                {forecast.sitterModeAutoOff.toLocaleString()} finished providers
                are currently in sitter mode and have not logged in for{" "}
                {INACTIVE_DAYS}+ days. Their sitter mode will be switched off.
              </p>
            </div>
            <div>
              <strong>{HIDDEN_DAYS}-day map rule</strong>
              <p>
                {forecast.inactive60Days.toLocaleString()} finished providers
                will fail the activity rule, including{" "}
                {forecast.inactive60DaysInSitterMode.toLocaleString()} whose
                sitter mode is still on. When last login is missing, account
                creation time is used.
                {forecast.unknownActivity > 0
                  ? ` ${forecast.unknownActivity.toLocaleString()} records have neither date and fail this rule.`
                  : ""}
              </p>
            </div>
          </div>

          <div className={styles.sectionHeading}>
            <h2 className={styles.sectionTitle}>
              Providers on map by Stripe status
            </h2>
            <p className={styles.sectionDescription}>
              Based on {forecast.mapProviderCount.toLocaleString()} providers
              returned by the app&apos;s unlimited-radius map endpoint.
              {forecast.mapProvidersMissingDetails > 0
                ? ` ${forecast.mapProvidersMissingDetails.toLocaleString()} could not be matched to admin provider records.`
                : ""}
            </p>
          </div>

          <div className={styles.grid}>
            {forecast.stripeStatusGroups.map((group) => (
              <article className={styles.card} key={group.label}>
                <p className={styles.cardLabel}>{group.label}</p>
                <div className={styles.statusRows}>
                  {group.rows.map((row) => (
                    <div className={styles.statusRow} key={row.label}>
                      <span>{row.label}</span>
                      <strong>{row.value.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default NannyForecast;
