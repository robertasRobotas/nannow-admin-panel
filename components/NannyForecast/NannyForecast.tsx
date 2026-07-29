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

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getEffectiveActivityDate = (nanny: NannyForecastItem) =>
  parseDate(nanny.lastLoginAt) ?? parseDate(nanny.createdAt);

const isOlderThan = (date: Date | null, cutoff: Date) =>
  date !== null && date.getTime() < cutoff.getTime();

const passesActivityRule = (
  nanny: NannyForecastItem,
  activityCutoff: Date,
) => {
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
          typeof page.hasMore === "boolean"
            ? page.hasMore
            : startIndex < total;

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
    const hidden = nannies.filter(
      (nanny) => !passesActivityRule(nanny, hiddenCutoff),
    );
    const finishedHidden = finished.filter((nanny) =>
      !passesActivityRule(nanny, hiddenCutoff),
    );
    const finishedVisible = finished.filter(
      (nanny) => passesActivityRule(nanny, hiddenCutoff),
    );
    const activityByProviderId = new Map<string, NannyForecastItem>();
    nannies.forEach((nanny) => {
      if (nanny.id) activityByProviderId.set(nanny.id, nanny);
      if (nanny.userId) activityByProviderId.set(nanny.userId, nanny);
    });
    const finalMapProviders = mapProviders.filter((provider) => {
      const nanny =
        activityByProviderId.get(provider.id) ??
        activityByProviderId.get(provider.userId);
      return nanny ? passesActivityRule(nanny, hiddenCutoff) : false;
    });
    const mapProvidersMissingActivity = mapProviders.filter(
      (provider) =>
        !activityByProviderId.has(provider.id) &&
        !activityByProviderId.has(provider.userId),
    );
    const unknownActivity = nannies.filter(
      (nanny) => getEffectiveActivityDate(nanny) === null,
    );
    const pendingSitterModeOff = nannies.filter(
      (nanny) =>
        nanny.isAvailableStatus === true &&
        isOlderThan(parseDate(nanny.lastLoginAt), inactiveCutoff),
    );

    return {
      total: nannies.length,
      unfinished: nannies.length - finished.length,
      finished: finished.length,
      sitterMode: finishedVisible.filter(
        (nanny) => nanny.isAvailableStatus === true,
      ).length,
      notSitterMode: finishedVisible.filter(
        (nanny) => nanny.isAvailableStatus !== true,
      ).length,
      hidden: hidden.length,
      finishedHidden: finishedHidden.length,
      currentMapProviders: mapProviders.length,
      finalMapProviders: finalMapProviders.length,
      mapProvidersHidden:
        mapProviders.length -
        finalMapProviders.length -
        mapProvidersMissingActivity.length,
      mapProvidersMissingActivity: mapProvidersMissingActivity.length,
      unknownActivity: unknownActivity.length,
      pendingSitterModeOff: pendingSitterModeOff.length,
    };
  }, [mapProviders, nannies]);

  const cards = [
    {
      label: "Nannies in total",
      value: forecast.total,
      detail: `${forecast.unfinished.toLocaleString()} with unfinished onboarding`,
    },
    {
      label: "Finished onboarding",
      value: forecast.finished,
      detail: "Includes every completed nanny profile",
    },
    {
      label: "In sitter mode",
      value: forecast.sitterMode,
      detail: `Finished onboarding and used the app within ${HIDDEN_DAYS} days`,
    },
    {
      label: "Not in sitter mode",
      value: forecast.notSitterMode,
      detail: `Finished onboarding and used the app within ${HIDDEN_DAYS} days`,
    },
    {
      label: `Inactive ${HIDDEN_DAYS}+ days`,
      value: forecast.hidden,
      detail: `${forecast.finishedHidden.toLocaleString()} finished onboarding; ${forecast.mapProvidersHidden.toLocaleString()} currently on map`,
    },
    {
      label: `Sitter mode auto-off forecast`,
      value: forecast.pendingSitterModeOff,
      detail: `Currently in sitter mode with no login for ${INACTIVE_DAYS}+ days`,
    },
    {
      label: "Current providers on map",
      value: forecast.currentMapProviders,
      detail: `Returned by the app map endpoint with a ${MAP_RADIUS_KM.toLocaleString()} km radius`,
    },
    {
      label: `Final providers on map`,
      value: forecast.finalMapProviders,
      detail: `${forecast.mapProvidersHidden.toLocaleString()} will be hidden by the ${HIDDEN_DAYS}-day rule`,
    },
  ];

  return (
    <section className={styles.root}>
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Activity forecast</p>
          <h1 className={styles.title}>Nanny visibility forecast</h1>
          <p className={styles.description}>
            Activity counts use all nanny records. Map counts use the same
            unlimited-radius provider endpoint as the app.
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
              <strong>How map quantities are calculated</strong>
              <p>
                Current providers are returned by the public map endpoint
                using Vilnius as the center and the app&apos;s{" "}
                {MAP_RADIUS_KM.toLocaleString()} km unlimited radius. Final
                providers are that same list after the {HIDDEN_DAYS}-day
                activity rule. Personal client filters can reduce a signed-in
                app result further.
                {forecast.mapProvidersMissingActivity > 0
                  ? ` ${forecast.mapProvidersMissingActivity.toLocaleString()} map providers could not be matched to activity records and are excluded from the final count.`
                  : ""}
              </p>
            </div>
            <div>
              <strong>Legacy activity records</strong>
              <p>
                When last login is missing, account creation time is used for
                the {HIDDEN_DAYS}-day map rule, matching the API visibility
                logic.
                {forecast.unknownActivity > 0
                  ? ` ${forecast.unknownActivity.toLocaleString()} records have neither date and fail the activity rule.`
                  : ""}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default NannyForecast;
