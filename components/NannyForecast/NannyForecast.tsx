import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getAllUsers } from "@/pages/api/fetch";
import Button from "@/components/Button/Button";
import styles from "./nannyForecast.module.css";

type StatusRow = {
  label: string;
  value: number;
};

type StatusGroup = {
  label: string;
  rows: StatusRow[];
};

type NannyForecastSnapshot = {
  generatedAt: string;
  totalRegisteredProviders: number;
  finishedOnboardingProviders: number;
  finishedOnboardingNotSelfHiddenProviders: number;
  inactive60DaysProviders: number;
  inactive60DaysInSitterModeProviders: number;
  inactive5DaysInSitterModeProviders: number;
  active60DaysProviders: number;
  active60DaysInSitterModeProviders: number;
  active5DaysInSitterModeProviders: number;
  finalOnMapProviders: number;
  mapProviderCount: number;
  stripeStatusGroups: StatusGroup[];
};

const formatSnapshotCount = (value?: number) =>
  typeof value === "number" ? value.toLocaleString() : "—";

const NannyForecast = () => {
  const [snapshot, setSnapshot] = useState<NannyForecastSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSnapshot = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getAllUsers("admin/nanny-forecast");
      setSnapshot(response.data as NannyForecastSnapshot);
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
    void loadSnapshot();
  }, [loadSnapshot]);

  const cards = snapshot
    ? [
        {
          label: "Total registered providers",
          value: snapshot.totalRegisteredProviders,
          detail: "Every registered provider account",
        },
        {
          label: "Finished onboarding",
          value: snapshot.finishedOnboardingProviders,
          detail:
            "Allowed to work; includes both fully completed and warning statuses",
        },
        {
          label: "Finished onboarding and not self-hidden",
          value: snapshot.finishedOnboardingNotSelfHiddenProviders,
          detail: "Finished providers whose map visibility preference is on",
        },
        {
          label: "Finished onboarding, not self-hidden, inactive 60+ days",
          value: snapshot.inactive60DaysProviders,
          detail: "Will be hidden by the 60-day map activity rule",
          secondaryDetail: `Active in the last 60 days: ${formatSnapshotCount(snapshot.active60DaysProviders)}`,
        },
        {
          label:
            "Finished onboarding, not self-hidden, inactive 60+ days, in sitter mode",
          value: snapshot.inactive60DaysInSitterModeProviders,
          detail: "Subset whose sitter mode is still on",
          secondaryDetail: `Active in the last 60 days, in sitter mode: ${formatSnapshotCount(snapshot.active60DaysInSitterModeProviders)}`,
        },
        {
          label: "Not active — no app use for 5+ days",
          value: snapshot.inactive5DaysInSitterModeProviders,
          detail: "In sitter mode and will be switched off by the 5-day rule",
          secondaryDetail: `Used the app in the last 5 days: ${formatSnapshotCount(snapshot.active5DaysInSitterModeProviders)}`,
        },
        {
          label: "Final on map",
          value: snapshot.finalOnMapProviders,
          detail:
            "Finished, not self-hidden providers active within the last 60 days",
        },
      ]
    : [];

  return (
    <section className={styles.root}>
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Activity forecast</p>
          <h1 className={styles.title}>Nanny visibility forecast</h1>
          <p className={styles.description}>
            Shows how the 5-day sitter-mode rule and 60-day map rule affect
            providers who are allowed to work. The snapshot updates nightly and
            when the API restarts.
          </p>
        </div>
        <Button
          title={isLoading ? "Loading…" : "Refresh"}
          type="OUTLINED"
          onClick={() => void loadSnapshot()}
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
            <span>Cached forecast snapshot</span>
            <span>
              {snapshot
                ? `Updated ${new Date(snapshot.generatedAt).toLocaleString()}`
                : "Loading snapshot…"}
            </span>
          </div>

          <div className={styles.grid} aria-busy={isLoading}>
            {isLoading && !snapshot ? (
              <article className={styles.card}>
                <p className={styles.cardLabel}>Loading forecast</p>
                <strong className={styles.cardValue}>—</strong>
              </article>
            ) : (
              cards.map((card) => (
                <article className={styles.card} key={card.label}>
                  <p className={styles.cardLabel}>{card.label}</p>
                  <strong className={styles.cardValue}>
                    {card.value.toLocaleString()}
                  </strong>
                  <p className={styles.cardDetail}>{card.detail}</p>
                  {card.secondaryDetail && (
                    <p className={styles.cardSecondaryDetail}>
                      {card.secondaryDetail}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>

          {snapshot && (
            <>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>
                  Providers on map by Stripe status
                </h2>
                <p className={styles.sectionDescription}>
                  Based on {snapshot.mapProviderCount.toLocaleString()}{" "}
                  providers returned by the app&apos;s unlimited-radius map
                  endpoint.
                </p>
              </div>

              <div className={styles.grid}>
                {snapshot.stripeStatusGroups.map((group) => (
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
        </>
      )}
    </section>
  );
};

export default NannyForecast;
