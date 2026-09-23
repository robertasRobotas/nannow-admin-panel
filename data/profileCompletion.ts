import type { UserDetails } from "@/types/Client";

/**
 * Profile completion ("Trust Level") logic for the admin panel — a faithful
 * port of the client-facing implementation so the admin card mirrors exactly
 * what the user sees in the app / website:
 *  - region requirement lists: nannow-api/src/common/utils/clientsRegion.ts +
 *    providersRegion.ts (PROVIDER_RUNTIME_ELIGIBILITY)
 *  - local checks + percentage: nannow-mobile-app/components/ProfileCompletion/
 *    completion.ts, as ported in nannow-website/src/lib/auth/completion.ts
 *  - Stripe-KYC flow: nannow-mobile-app/utils/providerKyc.ts (routing parts
 *    dropped)
 *  - row building (statuses, tones, bank/KYC row merge): nannow-website/src/
 *    components/auth/AuthProfilePage.tsx (buildRequirementRows)
 */

export type Region = "LITHUANIA" | "LATVIA" | "ESTONIA" | "FRANCE";

// Old users may have currentRegion === null (the field was added later).
// Treat them as LITHUANIA until a backfill runs (same as the API).
export const LEGACY_DEFAULT_REGION: Region = "LITHUANIA";

const COUNTRY_CODE_TO_REGION: Record<string, Region> = {
  LT: "LITHUANIA",
  LV: "LATVIA",
  EE: "ESTONIA",
  FR: "FRANCE",
};

const normalizeCountryCode = (country?: string | null): string | null => {
  if (!country) return null;
  const code = country.trim().toUpperCase();
  if (!code) return null;
  return code.length >= 2 ? code.slice(0, 2) : code;
};

export const resolveRegionFromCountry = (country?: string | null): Region | null => {
  const code = normalizeCountryCode(country);
  if (!code) return null;
  return COUNTRY_CODE_TO_REGION[code] ?? null;
};

export const getRegion = (user: UserDetails["user"] | null | undefined): Region =>
  user?.currentRegion ?? resolveRegionFromCountry(user?.country) ?? LEGACY_DEFAULT_REGION;

export type ClientRequirementKey =
  | "ID_VERIFIED"
  | "PROFILE_PHOTO_ADDED"
  | "ADDRESS_ADDED"
  | "CHILD_ADDED";

export type ProviderRequirementKey =
  | "ID_VERIFIED"
  | "STRIPE_ONBOARDING_FINISHED"
  | "KYC_VERIFIED"
  | "CRIMINAL_RECORD_APPROVED"
  | "BANK_ONBOARDING_APPROVED"
  | "PROFILE_PHOTO_ADDED"
  | "INTRO_ADDED"
  | "ADDRESS_ADDED";

// Onboarding gate: a client must satisfy these in their region before placing
// an order. ID verification is required in LT (legal/regulatory) but not in
// the other markets.
export const CLIENT_REQUIREMENTS_BY_REGION: Record<Region, ClientRequirementKey[]> = {
  LITHUANIA: ["ID_VERIFIED", "PROFILE_PHOTO_ADDED", "ADDRESS_ADDED", "CHILD_ADDED"],
  LATVIA: ["PROFILE_PHOTO_ADDED", "ADDRESS_ADDED", "CHILD_ADDED"],
  ESTONIA: ["PROFILE_PHOTO_ADDED", "ADDRESS_ADDED", "CHILD_ADDED"],
  FRANCE: ["PROFILE_PHOTO_ADDED", "ADDRESS_ADDED", "CHILD_ADDED"],
};

// Runtime gate: requirements a provider must satisfy to receive new-order
// notifications in a given region.
export const PROVIDER_REQUIREMENTS_BY_REGION: Record<
  Region,
  ProviderRequirementKey[]
> = {
  LITHUANIA: [
    "ID_VERIFIED",
    "STRIPE_ONBOARDING_FINISHED",
    "KYC_VERIFIED",
    "CRIMINAL_RECORD_APPROVED",
    "BANK_ONBOARDING_APPROVED",
    "PROFILE_PHOTO_ADDED",
    "INTRO_ADDED",
    "ADDRESS_ADDED",
  ],
  LATVIA: [
    "ID_VERIFIED",
    "STRIPE_ONBOARDING_FINISHED",
    "KYC_VERIFIED",
    "BANK_ONBOARDING_APPROVED",
    "PROFILE_PHOTO_ADDED",
    "INTRO_ADDED",
    "ADDRESS_ADDED",
  ],
  ESTONIA: [
    "ID_VERIFIED",
    "STRIPE_ONBOARDING_FINISHED",
    "PROFILE_PHOTO_ADDED",
    "INTRO_ADDED",
    "ADDRESS_ADDED",
  ],
  FRANCE: [
    "ID_VERIFIED",
    "STRIPE_ONBOARDING_FINISHED",
    "PROFILE_PHOTO_ADDED",
    "INTRO_ADDED",
    "ADDRESS_ADDED",
  ],
};

type ProviderProfileInput = UserDetails["provider"];
type ClientProfileInput = UserDetails["client"];

/** Port of nannow-website/src/lib/auth/completion.ts (getProviderStripeKycFlow). */
export type StripeKycFlow = {
  hasNewFields: boolean;
  mode: string | null;
  action: string | null;
  statusDetailed: string | null;
  isVerified: boolean;
  isBlocking: boolean;
  isWarning: boolean;
  isPendingReview: boolean;
};

const hasNewStripeKycFields = (
  pp: ProviderProfileInput | null | undefined,
): boolean =>
  Boolean(
    (pp?.stripeKycMode && pp.stripeKycMode !== "NONE") ||
      (pp?.stripeKycAction && pp.stripeKycAction !== "NONE") ||
      (pp?.stripeKycStatusDetailed && pp.stripeKycStatusDetailed !== "NONE") ||
      (pp?.stripeKycBlockingRequirements?.length ?? 0) ||
      (pp?.stripeKycFutureRequirements?.length ?? 0) ||
      (pp?.stripeKycPendingVerificationRequirements?.length ?? 0) ||
      pp?.stripeKycCurrentDeadline ||
      pp?.stripeKycFutureDeadline ||
      pp?.stripeKycDisabledReason,
  );

export const getProviderStripeKycFlow = (
  pp: ProviderProfileInput | null | undefined,
): StripeKycFlow => {
  const hasNewFields = hasNewStripeKycFields(pp);
  const mode = pp?.stripeKycMode ?? null;
  const action = pp?.stripeKycAction ?? null;
  const statusDetailed = pp?.stripeKycStatusDetailed ?? null;
  const legacyStatus = pp?.kycStatus ?? null;

  const isVerified = hasNewFields
    ? statusDetailed === "VERIFIED" || (mode === "NONE" && action === "NONE")
    : legacyStatus === "VERIFIED";
  const isPendingReview = hasNewFields
    ? action === "PENDING_VERIFICATION" || statusDetailed === "PENDING_VERIFICATION"
    : legacyStatus === "PENDING";
  const isWarning = hasNewFields
    ? mode === "WARNING" || statusDetailed === "FUTURE_ACTION_REQUIRED"
    : legacyStatus === "WARNING";
  const isBlocking =
    hasNewFields &&
    (mode === "BLOCKING" ||
      statusDetailed === "ACTION_REQUIRED" ||
      statusDetailed === "RESTRICTED");

  return {
    hasNewFields,
    mode,
    action,
    statusDetailed,
    isVerified,
    isBlocking,
    isWarning,
    isPendingReview,
  };
};

/** Port of the app's getClientRequirementChecks (admin data source). */
const getClientChecks = (
  user: UserDetails["user"],
  client: ClientProfileInput | null | undefined,
  addresses: UserDetails["addresses"],
  children: UserDetails["children"],
): Record<ClientRequirementKey, boolean> => ({
  ID_VERIFIED: Boolean(user?.isUserVerified),
  PROFILE_PHOTO_ADDED: Boolean(user?.imgUrl),
  ADDRESS_ADDED:
    (client?.addressesIds?.length ?? addresses?.length ?? 0) > 0,
  CHILD_ADDED: (client?.childIds?.length ?? children?.length ?? 0) > 0,
});

/** Port of the app's getProviderRequirementChecks (admin data source). */
const getProviderChecks = (
  user: UserDetails["user"],
  provider: ProviderProfileInput | null | undefined,
  addresses: UserDetails["addresses"],
): Record<ProviderRequirementKey, boolean> => {
  const criminalRecordStatus =
    provider?.criminalRecord?.currentStatus ?? provider?.criminalRecordStatus;
  const kycFlow = getProviderStripeKycFlow(provider);
  const isStripeWarningOnly = kycFlow.isWarning && !kycFlow.isBlocking;

  return {
    ID_VERIFIED: Boolean(user?.isUserVerified),
    STRIPE_ONBOARDING_FINISHED: Boolean(
      provider?.isStripeOnboardingFinished || isStripeWarningOnly,
    ),
    // Future Stripe requirements are non-blocking, so they should not reduce
    // the completion score even though the warning row stays visible.
    KYC_VERIFIED: kycFlow.isVerified || isStripeWarningOnly,
    CRIMINAL_RECORD_APPROVED: criminalRecordStatus === "APPROVED",
    BANK_ONBOARDING_APPROVED: provider?.bankOnboardingStatus === "APPROVED",
    PROFILE_PHOTO_ADDED: Boolean(user?.imgUrl),
    INTRO_ADDED: Boolean(provider?.intro),
    ADDRESS_ADDED:
      (provider?.addressesIds?.length ?? addresses?.length ?? 0) > 0,
  };
};

const getCompletionPercentage = (
  requirements: readonly string[],
  checks: Record<string, boolean>,
): number => {
  if (requirements.length === 0) return 100;
  const completedStepsCount = requirements.filter((r) => checks[r]).length;
  return Math.round((completedStepsCount / requirements.length) * 100);
};

export type RequirementTone = "done" | "warn" | "danger" | "neutral";

export type RequirementRow = {
  key: string;
  label: string;
  hint?: string;
  completed: boolean;
  status: string;
  tone: RequirementTone;
};

// English labels — the website's profile.completion strings.
const LABELS = {
  idVerification: "ID verification",
  criminalRecord: "Criminal Record Check",
  profilePicture: "Profile picture",
  aboutMe: "About me",
  address: "Address",
  bank: "Bank account information",
  kycVerification: "Bank verification",
  kycVerificationSubtitle: "Complete identity verification",
  stripeVerification: "Stripe verification",
  kidsInformation: "Kids information",
} as const;

const STATUS = {
  done: "Completed",
  incomplete: "Incomplete",
  pending: "Waiting for approval",
  approved: "Approved",
  rejected: "Rejected",
  kycWarning: "Warning",
} as const;

const buildClientRows = (
  user: UserDetails["user"],
  client: ClientProfileInput | null | undefined,
  addresses: UserDetails["addresses"],
  children: UserDetails["children"],
  region: Region,
): RequirementRow[] => {
  const requirements = CLIENT_REQUIREMENTS_BY_REGION[region] ?? [];
  const checks = getClientChecks(user, client, addresses, children);
  const rows: RequirementRow[] = [];

  for (const key of requirements) {
    const completed = checks[key];
    if (key === "PROFILE_PHOTO_ADDED" && !completed && user?.imgUrlRemoveMessage) {
      rows.push({
        key,
        label: LABELS.profilePicture,
        hint: `Reason: ${user.imgUrlRemoveMessage}`,
        completed,
        status: STATUS.incomplete,
        tone: "danger",
      });
      continue;
    }
    rows.push({
      key,
      label:
        key === "ID_VERIFIED"
          ? LABELS.idVerification
          : key === "PROFILE_PHOTO_ADDED"
            ? LABELS.profilePicture
            : key === "ADDRESS_ADDED"
              ? LABELS.address
              : LABELS.kidsInformation,
      completed,
      status: completed ? STATUS.done : STATUS.incomplete,
      tone: completed ? "done" : "danger",
    });
  }

  return rows;
};

/**
 * Port of nannow-website/src/components/auth/AuthProfilePage.tsx
 * (buildRequirementRows) without the API-status override — the admin details
 * response carries the full user/client/provider documents, so the raw
 * document fields provide the status words.
 */
const buildProviderRows = (
  user: UserDetails["user"],
  provider: ProviderProfileInput | null | undefined,
  addresses: UserDetails["addresses"],
  region: Region,
): RequirementRow[] => {
  const requirements = PROVIDER_REQUIREMENTS_BY_REGION[region] ?? [];
  const requires = (key: string) => requirements.includes(key as ProviderRequirementKey);
  const checks = getProviderChecks(user, provider, addresses);

  const criminalRecordStatus =
    provider?.criminalRecord?.currentStatus ?? provider?.criminalRecordStatus;
  const kycFlow = getProviderStripeKycFlow(provider);
  const isKycApproved = kycFlow.isVerified;

  const rows: RequirementRow[] = [];

  if (requires("ID_VERIFIED")) {
    const completed = checks.ID_VERIFIED;
    rows.push({
      key: "ID_VERIFIED",
      label: LABELS.idVerification,
      completed,
      status: completed ? STATUS.done : STATUS.incomplete,
      tone: completed ? "done" : "danger",
    });
  }

  if (requires("CRIMINAL_RECORD_APPROVED")) {
    const raw = criminalRecordStatus ?? "NOT_SUBMITTED";
    const completed = checks.CRIMINAL_RECORD_APPROVED;
    rows.push({
      key: "CRIMINAL_RECORD_APPROVED",
      label: LABELS.criminalRecord,
      completed,
      status:
        raw === "APPROVED"
          ? STATUS.approved
          : raw === "PENDING"
            ? STATUS.pending
            : raw === "REJECTED"
              ? STATUS.rejected
              : STATUS.incomplete,
      tone: raw === "APPROVED" ? "done" : raw === "PENDING" ? "warn" : "danger",
    });
  }

  if (requires("PROFILE_PHOTO_ADDED")) {
    const completed = checks.PROFILE_PHOTO_ADDED;
    rows.push({
      key: "PROFILE_PHOTO_ADDED",
      label: LABELS.profilePicture,
      hint:
        !completed && user?.imgUrlRemoveMessage
          ? `Reason: ${user.imgUrlRemoveMessage}`
          : undefined,
      completed,
      status: completed ? STATUS.done : STATUS.incomplete,
      tone: completed ? "done" : "danger",
    });
  }

  if (requires("INTRO_ADDED")) {
    const completed = checks.INTRO_ADDED;
    rows.push({
      key: "INTRO_ADDED",
      label: LABELS.aboutMe,
      completed,
      status: completed ? STATUS.done : STATUS.incomplete,
      tone: completed ? "done" : "danger",
    });
  }

  if (requires("ADDRESS_ADDED")) {
    const completed = checks.ADDRESS_ADDED;
    rows.push({
      key: "ADDRESS_ADDED",
      label: LABELS.address,
      completed,
      status: completed ? STATUS.done : STATUS.incomplete,
      tone: completed ? "done" : "danger",
    });
  }

  // The new Stripe-KYC flow replaces the bank + KYC rows with a single row.
  const shouldShowStripeKycMenu = kycFlow.hasNewFields && !isKycApproved;

  if (
    (requires("STRIPE_ONBOARDING_FINISHED") || requires("BANK_ONBOARDING_APPROVED")) &&
    !shouldShowStripeKycMenu
  ) {
    const bankRowDone =
      checks.STRIPE_ONBOARDING_FINISHED &&
      (!requires("BANK_ONBOARDING_APPROVED") || checks.BANK_ONBOARDING_APPROVED);
    const bankRaw = provider?.bankOnboardingStatus;
    rows.push({
      key: "BANK",
      label: LABELS.bank,
      completed: bankRowDone,
      status: bankRowDone
        ? STATUS.done
        : bankRaw === "PENDING"
          ? STATUS.pending
          : STATUS.incomplete,
      tone: bankRowDone ? "done" : bankRaw === "PENDING" ? "warn" : "danger",
    });
  }

  if (!kycFlow.hasNewFields && requires("KYC_VERIFIED") && checks.BANK_ONBOARDING_APPROVED) {
    const raw = provider?.kycStatus ?? "NOT_SUBMITTED";
    rows.push({
      key: "KYC_VERIFIED",
      label: LABELS.kycVerification,
      hint: LABELS.kycVerificationSubtitle,
      completed: checks.KYC_VERIFIED,
      status:
        raw === "VERIFIED"
          ? STATUS.done
          : raw === "PENDING"
            ? STATUS.pending
            : raw === "WARNING"
              ? STATUS.kycWarning
              : raw === "REJECTED"
                ? STATUS.rejected
                : STATUS.incomplete,
      tone:
        raw === "VERIFIED" ? "done" : raw === "PENDING" || raw === "WARNING" ? "warn" : "danger",
    });
  }

  if (shouldShowStripeKycMenu) {
    rows.push({
      key: "STRIPE_KYC",
      label: LABELS.stripeVerification,
      completed: false,
      status: kycFlow.isPendingReview
        ? STATUS.pending
        : kycFlow.isWarning
          ? STATUS.kycWarning
          : STATUS.incomplete,
      tone: kycFlow.isWarning ? "warn" : "neutral",
    });
  }

  return rows;
};

export type ProfileCompletion = {
  region: Region;
  percentage: number;
  isComplete: boolean;
  rows: RequirementRow[];
};

/**
 * The app's "Trust Level" completion for the given role, computed from the
 * admin details documents the same way the app/website compute it locally.
 */
export const getProfileCompletion = (
  user: UserDetails,
  mode: "client" | "provider",
): ProfileCompletion => {
  const region = getRegion(user.user);

  if (mode === "provider") {
    const checks = getProviderChecks(
      user.user,
      user.provider,
      user.addresses,
    );
    const requirements = PROVIDER_REQUIREMENTS_BY_REGION[region] ?? [];
    const kycFlow = getProviderStripeKycFlow(user.provider);
    // Same ladder as the app: a future-KYC warning is non-blocking (100),
    // otherwise the local checks over the region's requirement list.
    const isStripeFutureWarning = kycFlow.hasNewFields && kycFlow.isWarning;
    const percentage = isStripeFutureWarning
      ? 100
      : getCompletionPercentage(requirements, checks);

    return {
      region,
      percentage,
      isComplete: percentage === 100,
      rows: buildProviderRows(user.user, user.provider, user.addresses, region),
    };
  }

  const checks = getClientChecks(
    user.user,
    user.client,
    user.addresses,
    user.children,
  );
  const requirements = CLIENT_REQUIREMENTS_BY_REGION[region] ?? [];
  const percentage = getCompletionPercentage(requirements, checks);

  return {
    region,
    percentage,
    isComplete: percentage === 100,
    rows: buildClientRows(user.user, user.client, user.addresses, user.children, region),
  };
};

export const getProfileCompletionIncompleteCount = (
  user: UserDetails,
  mode: "client" | "provider",
): number => getProfileCompletion(user, mode).rows.filter((row) => !row.completed).length;
