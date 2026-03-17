import { useEffect, useState } from "react";
import { getAllUsers, getClientById, getProviderById } from "@/pages/api/fetch";
import { User, UserDetails } from "@/types/Client";
import styles from "./filterExport.module.css";
import { nunito } from "@/helpers/fonts";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import Button from "@/components/Button/Button";
import { useRouter } from "next/router";
import defaultUserImg from "@/assets/images/default-avatar.png";

type FilterMode = "CLIENT" | "PROVIDER";

type OnboardingField =
  | "USER_VERIFIED"
  | "PROFILE_PICTURE"
  | "ADDRESS"
  | "CHILD"
  | "ABOUT_ME"
  | "CRIMINAL_RECORD"
  | "BANK_ONBOARDING"
  | "KYC";

type EnrichedUser = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  imgUrl: string;
  mode: FilterMode;
  rating: number | null;
  reviewsCount: number;
  hasProfileVideo: boolean;
  finishedFields: OnboardingField[];
  notFinishedFields: OnboardingField[];
};

const CLIENT_FIELDS: OnboardingField[] = [
  "USER_VERIFIED",
  "PROFILE_PICTURE",
  "ADDRESS",
  "CHILD",
];

const PROVIDER_FIELDS: OnboardingField[] = [
  "USER_VERIFIED",
  "PROFILE_PICTURE",
  "ADDRESS",
  "ABOUT_ME",
  "CRIMINAL_RECORD",
  "BANK_ONBOARDING",
  "KYC",
];

const FIELD_LABELS: Record<OnboardingField, string> = {
  USER_VERIFIED: "User verified",
  PROFILE_PICTURE: "Profile picture",
  ADDRESS: "Address",
  CHILD: "Child",
  ABOUT_ME: "About me",
  CRIMINAL_RECORD: "Criminal record",
  BANK_ONBOARDING: "Bank onboarding",
  KYC: "KYC",
};

type ExtendedProvider = NonNullable<UserDetails["provider"]> & {
  intro?: string;
  bankOnboardingStatus?: string;
  kycStatus?: string;
  rating?: number | { generalRating?: number };
  videoUrl?: string;
};

type ExtendedClient = NonNullable<UserDetails["client"]> & {
  videoUrl?: string;
};

type ExtendedUser = UserDetails["user"] & {
  videoUrl?: string;
};

const modeOptions = [
  { title: "Clients", value: "CLIENT" },
  { title: "Providers", value: "PROVIDER" },
];

const extractNumericRating = (
  rating: unknown,
): number | null => {
  if (typeof rating === "number" && Number.isFinite(rating)) return rating;
  if (
    typeof rating === "object" &&
    rating !== null &&
    "generalRating" in rating &&
    typeof rating.generalRating === "number"
  ) {
    return rating.generalRating;
  }
  return null;
};

const toggleAllFields = (
  checked: boolean,
  fields: OnboardingField[],
  setState: React.Dispatch<React.SetStateAction<OnboardingField[]>>,
) => {
  setState(checked ? fields : []);
};

const extractProfileVideo = (detail: UserDetails): boolean => {
  const user = detail.user as ExtendedUser;
  const provider = detail.provider as ExtendedProvider | undefined;
  const client = detail.client as ExtendedClient | undefined;
  const candidates = [
    provider?.videoUrl,
    client?.videoUrl,
    user?.videoUrl,
  ];

  return candidates.some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
};

const buildFinishedFields = (
  detail: UserDetails,
  mode: FilterMode,
): OnboardingField[] => {
  const provider = detail.provider as ExtendedProvider | undefined;
  const currentCriminalStatus = String(
    provider?.criminalRecord?.currentStatus ??
      provider?.criminalRecordStatus ??
      "",
  ).toUpperCase();

  const statusByField: Record<OnboardingField, boolean> = {
    USER_VERIFIED: detail.user?.isUserVerified === true,
    PROFILE_PICTURE: Boolean(detail.user?.imgUrl?.trim()),
    ADDRESS: Array.isArray(detail.addresses) && detail.addresses.length > 0,
    CHILD: Array.isArray(detail.children) && detail.children.length > 0,
    ABOUT_ME: Boolean(provider?.intro?.trim()),
    CRIMINAL_RECORD: currentCriminalStatus === "APPROVED",
    BANK_ONBOARDING:
      String(provider?.bankOnboardingStatus ?? "").toUpperCase() ===
      "APPROVED",
    KYC: String(provider?.kycStatus ?? "").toUpperCase() === "VERIFIED",
  };

  const fields = mode === "CLIENT" ? CLIENT_FIELDS : PROVIDER_FIELDS;
  return fields.filter((field) => statusByField[field]);
};

const mapDetailedUser = (
  baseUser: User,
  detail: UserDetails,
  mode: FilterMode,
): EnrichedUser => {
  const provider = detail.provider as ExtendedProvider | undefined;
  const rating =
    mode === "CLIENT"
      ? extractNumericRating(detail.client?.rating)
      : extractNumericRating(provider?.rating);
  const reviewsCount = Array.isArray(detail.receivedReviews)
    ? detail.receivedReviews.length
    : typeof detail.client?.positiveReviewsCount === "number"
      ? detail.client.positiveReviewsCount
      : 0;
  const finishedFields = buildFinishedFields(detail, mode);
  const allFields = mode === "CLIENT" ? CLIENT_FIELDS : PROVIDER_FIELDS;

  return {
    id: baseUser.id,
    userId: baseUser.userId,
    firstName: detail.user?.firstName ?? baseUser.firstName,
    lastName: detail.user?.lastName ?? baseUser.lastName,
    email: detail.user?.email ?? baseUser.email,
    imgUrl: detail.user?.imgUrl ?? baseUser.imgUrl,
    mode,
    rating,
    reviewsCount,
    hasProfileVideo: extractProfileVideo(detail),
    finishedFields,
    notFinishedFields: allFields.filter(
      (field) => !finishedFields.includes(field),
    ),
  };
};

const fetchAllBaseUsers = async (mode: FilterMode): Promise<User[]> => {
  const collected: User[] = [];
  let startIndex = 0;
  let total = Number.MAX_SAFE_INTEGER;

  while (startIndex < total) {
    const response = await getAllUsers(
      `admin/users?type=${mode.toLowerCase()}&startIndex=${startIndex}&search=`,
    );
    const payload = response.data?.users;
    const items = Array.isArray(payload?.items) ? (payload.items as User[]) : [];
    const pageSize = Number(payload?.pageSize ?? items.length ?? 0);
    total = Number(payload?.total ?? collected.length + items.length);
    collected.push(...items);

    if (items.length === 0 || pageSize <= 0) break;
    startIndex += pageSize;
  }

  return collected;
};

const downloadCsv = (rows: EnrichedUser[]) => {
  const headers = [
    "Email",
    "Name",
    "Type",
    "Rating",
    "Reviews Count",
    "Has Profile Video",
    "Finished Onboarding Fields",
    "Not Finished Onboarding Fields",
  ];

  const escape = (value: string | number | boolean | null) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.email,
        `${row.firstName} ${row.lastName}`.trim(),
        row.mode,
        row.rating ?? "",
        row.reviewsCount,
        row.hasProfileVideo ? "YES" : "NO",
        row.finishedFields.map((field) => FIELD_LABELS[field]).join(" | "),
        row.notFinishedFields.map((field) => FIELD_LABELS[field]).join(" | "),
      ]
        .map(escape)
        .join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "users-filter-export.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const FilterExport = () => {
  const router = useRouter();
  const [selectedModeOption, setSelectedModeOption] = useState(0);
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [minimumReviews, setMinimumReviews] = useState("0");
  const [hasProfileVideoOnly, setHasProfileVideoOnly] = useState(false);
  const [ratingFrom, setRatingFrom] = useState(0);
  const [ratingTo, setRatingTo] = useState(5);
  const [finishedFields, setFinishedFields] = useState<OnboardingField[]>([]);
  const [notFinishedFields, setNotFinishedFields] = useState<OnboardingField[]>(
    [],
  );

  const selectedMode = modeOptions[selectedModeOption]?.value as FilterMode;
  const availableFields =
    selectedMode === "CLIENT" ? CLIENT_FIELDS : PROVIDER_FIELDS;

  useEffect(() => {
    setFinishedFields((prev) =>
      prev.filter((field) => availableFields.includes(field)),
    );
    setNotFinishedFields((prev) =>
      prev.filter((field) => availableFields.includes(field)),
    );
  }, [selectedMode]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        setIsLoading(true);
        setLoadingText("Loading user list...");
        const baseUsers = await fetchAllBaseUsers(selectedMode);
        const nextUsers: EnrichedUser[] = [];

        for (let index = 0; index < baseUsers.length; index += 8) {
          const batch = baseUsers.slice(index, index + 8);
          setLoadingText(
            `Loading user details ${Math.min(index + batch.length, baseUsers.length)}/${baseUsers.length}`,
          );
          const details = await Promise.all(
            batch.map(async (baseUser) => {
              const response =
                selectedMode === "CLIENT"
                  ? await getClientById(baseUser.userId)
                  : await getProviderById(baseUser.userId);
              const detail =
                selectedMode === "CLIENT"
                  ? (response.data?.clientDetails as UserDetails)
                  : (response.data?.providerDetails as UserDetails);

              return mapDetailedUser(baseUser, detail, selectedMode);
            }),
          );
          nextUsers.push(...details);
        }

        if (!isCancelled) {
          setUsers(nextUsers);
        }
      } catch (error) {
        if (!isCancelled) {
          setUsers([]);
          setLoadingText("Failed to load users.");
        }
        console.error(error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, [selectedMode]);

  const normalizedMinimumReviews = Number(minimumReviews);
  const filteredUsers = users.filter((user) => {
    if (
      Number.isFinite(normalizedMinimumReviews) &&
      normalizedMinimumReviews > 0 &&
      user.reviewsCount < normalizedMinimumReviews
    ) {
      return false;
    }
    if (hasProfileVideoOnly && !user.hasProfileVideo) {
      return false;
    }
    if (user.rating != null && user.rating < ratingFrom) {
      return false;
    }
    if (user.rating != null && user.rating > ratingTo) {
      return false;
    }
    if (user.rating == null && (ratingFrom > 0 || ratingTo < 5)) {
      return false;
    }
    if (!finishedFields.every((field) => user.finishedFields.includes(field))) {
      return false;
    }
    if (
      !notFinishedFields.every((field) => user.notFinishedFields.includes(field))
    ) {
      return false;
    }
    return true;
  });

  const toggleField = (
    field: OnboardingField,
    state: OnboardingField[],
    setState: React.Dispatch<React.SetStateAction<OnboardingField[]>>,
  ) => {
    setState((prev) =>
      prev.includes(field)
        ? prev.filter((item) => item !== field)
        : [...prev, field],
    );
  };

  return (
    <div className={styles.main}>
      <div className={styles.topRow}>
        <div>
          <div className={`${styles.title} ${nunito.className}`}>
            Filter and export
          </div>
          <div className={styles.subtitle}>
            Load users by mode, apply filters, export filtered result to CSV.
          </div>
        </div>
        <div className={styles.topActions}>
          <Button
            title="Back to users"
            type="OUTLINED"
            onClick={() => router.push("/users")}
          />
          <Button
            title="Export CSV"
            type="BLACK"
            onClick={() => downloadCsv(filteredUsers)}
            isDisabled={isLoading || filteredUsers.length === 0}
          />
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.filtersCard}>
          <div className={styles.sectionTitle}>Filters</div>

          <div className={styles.filterBlock}>
            <div className={styles.label}>User type</div>
            <DropDownButton
              options={modeOptions}
              selectedOption={selectedModeOption}
              setSelectedOption={setSelectedModeOption}
            />
          </div>

          <div className={styles.filterBlock}>
            <div className={styles.label}>Finished onboarding fields</div>
            <div className={styles.checkGrid}>
              <label className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={
                    availableFields.length > 0 &&
                    finishedFields.length === availableFields.length
                  }
                  onChange={(event) =>
                    toggleAllFields(
                      event.target.checked,
                      availableFields,
                      setFinishedFields,
                    )
                  }
                />
                <span>All</span>
              </label>
              {availableFields.map((field) => (
                <label key={`finished-${field}`} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={finishedFields.includes(field)}
                    onChange={() =>
                      toggleField(field, finishedFields, setFinishedFields)
                    }
                  />
                  <span>{FIELD_LABELS[field]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.filterBlock}>
            <div className={styles.label}>Not finished onboarding fields</div>
            <div className={styles.checkGrid}>
              <label className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={
                    availableFields.length > 0 &&
                    notFinishedFields.length === availableFields.length
                  }
                  onChange={(event) =>
                    toggleAllFields(
                      event.target.checked,
                      availableFields,
                      setNotFinishedFields,
                    )
                  }
                />
                <span>All</span>
              </label>
              {availableFields.map((field) => (
                <label key={`not-finished-${field}`} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={notFinishedFields.includes(field)}
                    onChange={() =>
                      toggleField(field, notFinishedFields, setNotFinishedFields)
                    }
                  />
                  <span>{FIELD_LABELS[field]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.inlineFields}>
            <div className={styles.fieldColumn}>
              <div className={styles.label}>Minimum reviews</div>
              <input
                className={styles.textInput}
                type="number"
                min="0"
                value={minimumReviews}
                onChange={(event) => setMinimumReviews(event.target.value)}
              />
            </div>
            <label className={styles.videoCheck}>
              <input
                type="checkbox"
                checked={hasProfileVideoOnly}
                onChange={() => setHasProfileVideoOnly((prev) => !prev)}
              />
              <span>Has profile video</span>
            </label>
          </div>

          <div className={styles.filterBlock}>
            <div className={styles.label}>Rating range</div>
            <div className={styles.sliderValues}>
              <span>From {ratingFrom.toFixed(1)}</span>
              <span>To {ratingTo.toFixed(1)}</span>
            </div>
            <div className={styles.sliderGroup}>
              <input
                className={styles.rangeInput}
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={ratingFrom}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setRatingFrom(Math.min(nextValue, ratingTo));
                }}
              />
              <input
                className={styles.rangeInput}
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={ratingTo}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setRatingTo(Math.max(nextValue, ratingFrom));
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles.resultsCard}>
          <div className={styles.resultsHeader}>
            <div>
              <div className={styles.sectionTitle}>Results</div>
              <div className={styles.resultsMeta}>
                {isLoading
                  ? loadingText
                  : `${filteredUsers.length} of ${users.length} users match filters`}
              </div>
            </div>
          </div>

          <div className={styles.resultsList}>
            {filteredUsers.map((user) => (
              <div key={user.userId} className={styles.resultRow}>
                <div className={styles.resultMain}>
                  <img
                    className={styles.avatar}
                    src={user.imgUrl || defaultUserImg.src}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                  <div>
                    <div className={styles.name}>
                      {`${user.firstName} ${user.lastName}`.trim() || "Unknown user"}
                    </div>
                    <div className={styles.meta}>{user.email || "—"}</div>
                    <div className={styles.meta}>{user.userId}</div>
                  </div>
                </div>
                <div className={styles.resultStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Rating</span>
                    <span className={styles.statValue}>
                      {user.rating != null ? user.rating.toFixed(1) : "—"}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Reviews</span>
                    <span className={styles.statValue}>{user.reviewsCount}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Video</span>
                    <span className={styles.statValue}>
                      {user.hasProfileVideo ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                <div className={styles.resultActions}>
                  <Button
                    title="Open profile"
                    type="OUTLINED"
                    onClick={() =>
                      router.push(
                        user.mode === "CLIENT"
                          ? `/client/${user.userId}`
                          : `/provider/${user.userId}`,
                      )
                    }
                  />
                </div>
              </div>
            ))}
            {!isLoading && filteredUsers.length === 0 && (
              <div className={styles.emptyState}>No users match current filters.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterExport;
