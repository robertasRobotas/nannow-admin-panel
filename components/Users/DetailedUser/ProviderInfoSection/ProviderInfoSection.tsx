import Button from "@/components/Button/Button";
import { copyTextToClipboard } from "@/helpers/clipboardWrites";
import { nunito } from "@/helpers/fonts";
import { startProviderStripeOnboardingTest } from "@/pages/api/fetch";
import { QualityType, UserDetails } from "@/types/Client";
import axios from "axios";
import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import { toast } from "react-toastify";
import styles from "./providerInfoSection.module.css";

type ProviderInfoSectionProps = {
  provider: UserDetails["provider"];
  onBackClick: () => void;
};

type StripeKycFieldKey =
  | "kycStatus"
  | "stripeKycStatus"
  | "stripeKycMode"
  | "stripeKycAction"
  | "stripeKycBlockingRequirements"
  | "stripeKycFutureRequirements"
  | "stripeKycPendingVerificationRequirements"
  | "stripeKycCurrentDeadline"
  | "stripeKycFutureDeadline"
  | "stripeKycDisabledReason"
  | "stripeKycLastCheckedAt";

type StripeKycFieldConfig = {
  key: StripeKycFieldKey;
  label: string;
  description: string;
};

const QUALITY_LABELS: Record<QualityType, string> = {
  CAN_BABYSIT_AT_HOME: "Can babysit at home",
  LT_LANGUAGE: "Lithuanian language",
  FIRST_AID: "First aid",
  DRIVER_LICENSE: "Driver license",
  CAR: "Car",
  CAN_SHOP: "Can shop",
  CAN_CLEAN: "Can clean",
  NON_SMOKER: "Non-smoker",
  CAN_GO_OUTSIDE: "Can go outside",
  CAN_COOK: "Can cook",
  LOVES_PETS: "Loves pets",
  CAN_SWIM: "Can swim",
  PRIMARY_SCHOOL_TEACHER: "Primary school teacher",
  SINGING_TEACHER: "Singing teacher",
  DANCE_TEACHER: "Dance teacher",
  GUITAR: "Guitar",
  PIANO: "Piano",
  CAT_ALLERGY: "Cat allergy",
  DOG_ALLERGY: "Dog allergy",
  ASTHMA: "Asthma",
};

const getQualityLabel = (quality: QualityType) =>
  QUALITY_LABELS[quality] ?? quality.replace(/_/g, " ").toLowerCase();

const STRIPE_KYC_FIELD_CONFIGS: StripeKycFieldConfig[] = [
  {
    key: "kycStatus",
    label: "Legacy KYC status",
    description: "Compatibility state used by older onboarding flows.",
  },
  {
    key: "stripeKycStatus",
    label: "Stripe KYC status",
    description: "Detailed verification state reported by Stripe.",
  },
  {
    key: "stripeKycMode",
    label: "KYC mode",
    description: "Whether the current issue is blocking now or only a warning.",
  },
  {
    key: "stripeKycAction",
    label: "Recommended action",
    description: "UI flow Stripe recommends next.",
  },
  {
    key: "stripeKycBlockingRequirements",
    label: "Blocking requirements",
    description: "Requirements that must be completed right now.",
  },
  {
    key: "stripeKycFutureRequirements",
    label: "Future requirements",
    description: "Upcoming requirements Stripe already knows about.",
  },
  {
    key: "stripeKycPendingVerificationRequirements",
    label: "Pending verification",
    description: "Submitted items that are still under Stripe review.",
  },
  {
    key: "stripeKycCurrentDeadline",
    label: "Current deadline",
    description: "Deadline for the current blocking requirement, when present.",
  },
  {
    key: "stripeKycFutureDeadline",
    label: "Future deadline",
    description: "Deadline for upcoming requirements, when present.",
  },
  {
    key: "stripeKycDisabledReason",
    label: "Disabled reason",
    description: "Why Stripe marked the account as disabled or needing remediation.",
  },
  {
    key: "stripeKycLastCheckedAt",
    label: "Last checked",
    description: "When the provider KYC state was last synced from Stripe.",
  },
];

const formatStripeKycValue = (
  key: StripeKycFieldKey,
  value: unknown,
): string => {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "None";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "string") {
    if (key.toLowerCase().includes("deadline") || key === "stripeKycLastCheckedAt") {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date.toLocaleString();
    }
    return value;
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const getStripeAccountId = (provider: UserDetails["provider"]) =>
  provider?.stripeAccountId?.trim() ??
  provider?.stripe?.accountId?.trim() ??
  "";

const getStripeKycValue = (
  provider: UserDetails["provider"],
  key: StripeKycFieldKey,
) => {
  if (!provider) return undefined;
  if (key === "kycStatus") {
    return provider.kycStatus ?? provider.stripeKycStatus ?? undefined;
  }
  return provider[key];
};

const ProviderInfoSection = ({
  provider,
  onBackClick,
}: ProviderInfoSectionProps) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [isLaunchingOnboardingTest, setIsLaunchingOnboardingTest] = useState(false);
  const [onboardingClientSecret, setOnboardingClientSecret] = useState<string | null>(null);
  const intro = provider?.intro?.trim();
  const qualities = provider?.qualitiesIds ?? [];
  const stripeAccountId = getStripeAccountId(provider);
  const stripeKycDescriptions = provider?.stripeKycFieldDescriptions ?? {};
  const hasStripeKycData =
    Boolean(stripeAccountId) ||
    STRIPE_KYC_FIELD_CONFIGS.some(({ key }) => {
      const value = getStripeKycValue(provider, key);
      return Array.isArray(value) ? value.length > 0 : value != null && value !== "";
    }) ||
    Object.keys(stripeKycDescriptions).length > 0;

  const runOnboardingTest = async () => {
    if (!provider?.userId || isLaunchingOnboardingTest) return;

    try {
      setIsLaunchingOnboardingTest(true);
      const response = await startProviderStripeOnboardingTest(provider.userId);
      const clientSecret = response.data.result.clientSecret;
      setOnboardingClientSecret(clientSecret);
      toast.success("Stripe onboarding test session created");
    } catch (error) {
      console.error(error);
      const message = axios.isAxiosError(error)
        ? String(error.response?.data?.error ?? error.message ?? "Failed to start onboarding test")
        : "Failed to start onboarding test";
      toast.error(message);
    } finally {
      setIsLaunchingOnboardingTest(false);
    }
  };

  const copyClientSecret = async () => {
    if (!onboardingClientSecret) return;
    const didCopy = await copyTextToClipboard(onboardingClientSecret);
    toast[didCopy ? "success" : "error"](
      didCopy ? "Client secret copied" : "Could not copy client secret",
    );
  };

  return (
    <div className={styles.main}>
      <h3 className={`${styles.title} ${nunito.className}`}>Provider info</h3>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Intro</span>
          <span className={styles.counter}>{intro?.length ?? 0}/1000</span>
        </div>
        {intro ? (
          <p className={`${styles.intro} ${nunito.className}`}>{intro}</p>
        ) : (
          <div className={styles.empty}>No intro added</div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Qualities</span>
          <span className={styles.counter}>{qualities.length}</span>
        </div>
        {qualities.length > 0 ? (
          <div className={styles.qualityList}>
            {qualities.map((quality) => (
              <span key={quality} className={styles.quality}>
                {getQualityLabel(quality)}
              </span>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>No qualities selected</div>
        )}
      </section>

      {hasStripeKycData && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.label}>Stripe KYC</span>
            {stripeAccountId ? (
              <span className={styles.counter}>{stripeAccountId}</span>
            ) : (
              <span className={styles.counter}>No connected account</span>
            )}
          </div>

          <div className={styles.stripeKycActions}>
            <Button
              title="Run onboarding test"
              type="BLACK"
              onClick={runOnboardingTest}
              isLoading={isLaunchingOnboardingTest}
              isDisabled={!provider?.userId || !stripeAccountId}
            />
            {onboardingClientSecret && (
              <Button
                title="Copy client secret"
                type="OUTLINED"
                onClick={copyClientSecret}
              />
            )}
          </div>

          {onboardingClientSecret && (
            <div className={styles.clientSecretBox}>
              <div className={styles.clientSecretLabel}>Client secret</div>
              <pre className={styles.clientSecretValue}>{onboardingClientSecret}</pre>
            </div>
          )}

          <div className={styles.stripeKycGrid}>
            {STRIPE_KYC_FIELD_CONFIGS.map(({ key, label, description }) => {
              const providerDescription =
                stripeKycDescriptions[key] ?? stripeKycDescriptions[label] ?? "";
              const rawValue = getStripeKycValue(provider, key);
              return (
                <div key={key} className={styles.stripeKycCard}>
                  <div className={styles.stripeKycCardLabel}>{label}</div>
                  <div className={styles.stripeKycCardValue}>
                    {formatStripeKycValue(key, rawValue)}
                  </div>
                  <div className={styles.stripeKycCardDescription}>
                    {providerDescription || description}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {isMobile && (
        <div className={styles.backBtnWrapper}>
          <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        </div>
      )}
    </div>
  );
};

export default ProviderInfoSection;
