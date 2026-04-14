import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import ReactPaginate from "react-paginate";
import { toast } from "react-toastify";
import Button from "@/components/Button/Button";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import SearchBar from "@/components/SearchBar/SearchBar";
import { nunito } from "@/helpers/fonts";
import defaultAvatarImg from "@/assets/images/default-avatar.png";
import paginateStyles from "@/styles/paginate.module.css";
import {
  getBroadcastNotificationCampaignById,
  getBroadcastNotificationCampaigns,
  getBroadcastNotificationSender,
  getMarketplaceAnalyticsLocations,
  getUsersAppVersionStats,
  previewBroadcastNotifications,
  sendBroadcastNotifications,
} from "@/pages/api/fetch";
import type {
  BroadcastNotificationCampaign,
  BroadcastNotificationCampaignDetailResponse,
  BroadcastNotificationCampaignRecipient,
  BroadcastNotificationCampaignsListResponse,
  BroadcastNotificationFilters,
  BroadcastNotificationPreviewRecipient,
  BroadcastNotificationPreviewResponse,
  BroadcastNotificationRole,
  BroadcastNotificationSender,
  BroadcastNotificationSenderResponse,
} from "@/types/BroadcastNotifications";
import type {
  GetMarketplaceAnalyticsLocationsResponse,
  MarketplaceAnalyticsLocationCountry,
} from "@/types/MarketplaceAnalytics";
import styles from "./campaigns.module.css";

const PAGE_SIZE = 20;
const BOOLEAN_FILTER_OPTIONS = [
  { title: "All", value: "all" },
  { title: "Yes", value: "true" },
  { title: "No", value: "false" },
] as const;
const COUNTRY_ALL_OPTION = { title: "All countries", value: "" };
const CITY_ALL_OPTION = { title: "All cities", value: "" };
const ROLE_OPTIONS: BroadcastNotificationRole[] = ["CLIENT", "PROVIDER"];
const LANGUAGE_OPTIONS = [
  { title: "All languages", value: "" },
  { title: "Lietuvių", value: "LT" },
  { title: "English", value: "EN" },
  { title: "Deutsch", value: "DE" },
  { title: "Français", value: "FR" },
  { title: "Українська", value: "UA" },
  { title: "Polski", value: "PL" },
  { title: "Latvian", value: "LV" },
  { title: "Eesti", value: "EE" },
];

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

const getUserDisplayName = (
  firstName?: string | null,
  lastName?: string | null,
) => `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Unknown user";

const getBooleanValue = (value: "all" | "true" | "false") => {
  if (value === "all") return undefined;
  return value === "true";
};

const parseNumberValue = (value: string) => {
  if (!value.trim()) return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const formatFiltersSummary = (filters?: BroadcastNotificationFilters) => {
  if (!filters) return "No filters";
  const parts: string[] = [];

  if (filters.country) parts.push(`Country: ${filters.country}`);
  if (filters.city) parts.push(`City: ${filters.city}`);
  if (filters.currentRoles?.length) {
    parts.push(`Roles: ${filters.currentRoles.join(", ")}`);
  }
  if (typeof filters.isOnboardingFinished === "boolean") {
    parts.push(
      `Onboarding: ${filters.isOnboardingFinished ? "Finished" : "Not finished"}`,
    );
  }
  if (typeof filters.isProfilePictureAdded === "boolean") {
    parts.push(
      `Profile image: ${filters.isProfilePictureAdded ? "Added" : "Missing"}`,
    );
  }
  if (typeof filters.hasActivityNumber === "boolean") {
    parts.push(`Activity number: ${filters.hasActivityNumber ? "Yes" : "No"}`);
  }
  if (typeof filters.childQtyMin === "number") {
    parts.push(`Children min: ${filters.childQtyMin}`);
  }
  if (typeof filters.childQtyMax === "number") {
    parts.push(`Children max: ${filters.childQtyMax}`);
  }
  if (filters.appVersions?.length) {
    parts.push(`App versions: ${filters.appVersions.join(", ")}`);
  }
  if (typeof filters.generalRatingMin === "number") {
    parts.push(`Rating min: ${filters.generalRatingMin}`);
  }
  if (typeof filters.generalRatingMax === "number") {
    parts.push(`Rating max: ${filters.generalRatingMax}`);
  }
  if (filters.language) {
    const langTitle = LANGUAGE_OPTIONS.find(
      (l) => l.value === filters.language,
    )?.title;

    if (langTitle) parts.push(`Language: ${langTitle}`);
  }
  return parts.length > 0 ? parts.join(" • ") : "No filters";
};

const Campaigns = () => {
  const [sender, setSender] = useState<BroadcastNotificationSender | null>(
    null,
  );
  const [locations, setLocations] = useState<
    MarketplaceAnalyticsLocationCountry[]
  >([]);
  const [availableAppVersions, setAvailableAppVersions] = useState<string[]>(
    [],
  );

  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [currentRoles, setCurrentRoles] = useState<BroadcastNotificationRole[]>(
    [],
  );
  const [onboardingFinishedFilter, setOnboardingFinishedFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const [profileImageFilter, setProfileImageFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const [activityNumberFilter, setActivityNumberFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const [childQtyMin, setChildQtyMin] = useState("");
  const [childQtyMax, setChildQtyMax] = useState("");
  const [generalRatingMin, setGeneralRatingMin] = useState("");
  const [generalRatingMax, setGeneralRatingMax] = useState("");
  const [selectedAppVersions, setSelectedAppVersions] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [campaignText, setCampaignText] = useState("");

  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [previewRecipientsCount, setPreviewRecipientsCount] = useState<
    number | null
  >(null);
  const [previewRecipients, setPreviewRecipients] = useState<
    BroadcastNotificationPreviewRecipient[]
  >([]);

  const [campaigns, setCampaigns] = useState<BroadcastNotificationCampaign[]>(
    [],
  );
  const [campaignsTotal, setCampaignsTotal] = useState(0);
  const [campaignItemOffset, setCampaignItemOffset] = useState(0);
  const [campaignPageCount, setCampaignPageCount] = useState(0);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const [selectedCampaign, setSelectedCampaign] =
    useState<BroadcastNotificationCampaign | null>(null);
  const [recipients, setRecipients] = useState<
    BroadcastNotificationCampaignRecipient[]
  >([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [recipientItemOffset, setRecipientItemOffset] = useState(0);
  const [recipientPageCount, setRecipientPageCount] = useState(0);
  const [recipientSearchText, setRecipientSearchText] = useState("");
  const [appliedRecipientSearch, setAppliedRecipientSearch] = useState("");
  const [campaignDetailsLoading, setCampaignDetailsLoading] = useState(false);
  const [isRecipientsOpen, setIsRecipientsOpen] = useState(false);
  const [error, setError] = useState("");

  const buildFilters = useCallback((): BroadcastNotificationFilters => {
    const nextFilters: BroadcastNotificationFilters = {};

    if (countryCode) nextFilters.country = countryCode;
    if (city) nextFilters.city = city;
    if (currentRoles.length > 0) nextFilters.currentRoles = currentRoles;

    const onboardingFinished = getBooleanValue(onboardingFinishedFilter);
    if (typeof onboardingFinished === "boolean") {
      nextFilters.isOnboardingFinished = onboardingFinished;
    }

    const isProfilePictureAdded = getBooleanValue(profileImageFilter);
    if (typeof isProfilePictureAdded === "boolean") {
      nextFilters.isProfilePictureAdded = isProfilePictureAdded;
    }

    const hasActivityNumber = getBooleanValue(activityNumberFilter);
    if (typeof hasActivityNumber === "boolean") {
      nextFilters.hasActivityNumber = hasActivityNumber;
    }

    const parsedChildQtyMin = parseNumberValue(childQtyMin);
    const parsedChildQtyMax = parseNumberValue(childQtyMax);
    const parsedGeneralRatingMin = parseNumberValue(generalRatingMin);
    const parsedGeneralRatingMax = parseNumberValue(generalRatingMax);

    if (typeof parsedChildQtyMin === "number") {
      nextFilters.childQtyMin = parsedChildQtyMin;
    }
    if (typeof parsedChildQtyMax === "number") {
      nextFilters.childQtyMax = parsedChildQtyMax;
    }
    if (typeof parsedGeneralRatingMin === "number") {
      nextFilters.generalRatingMin = parsedGeneralRatingMin;
    }
    if (typeof parsedGeneralRatingMax === "number") {
      nextFilters.generalRatingMax = parsedGeneralRatingMax;
    }
    if (selectedAppVersions.length > 0) {
      nextFilters.appVersions = selectedAppVersions;
    }
    if (language) nextFilters.language = language;

    return nextFilters;
  }, [
    activityNumberFilter,
    childQtyMax,
    childQtyMin,
    city,
    countryCode,
    currentRoles,
    generalRatingMax,
    generalRatingMin,
    onboardingFinishedFilter,
    profileImageFilter,
    selectedAppVersions,
    language,
  ]);

  const countryOptions = useMemo(
    () => [
      COUNTRY_ALL_OPTION,
      ...locations.map((location) => ({
        title: location.name,
        value: location.code,
      })),
    ],
    [locations],
  );

  const cityOptions = useMemo(() => {
    if (countryCode) {
      const country = locations.find((item) => item.code === countryCode);
      return [
        CITY_ALL_OPTION,
        ...(country?.cities ?? []).map((item) => ({
          title: item.name,
          value: item.name,
        })),
      ];
    }

    const uniqueCities = Array.from(
      new Set(
        locations.flatMap((country) => country.cities.map((item) => item.name)),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return [
      CITY_ALL_OPTION,
      ...uniqueCities.map((item) => ({ title: item, value: item })),
    ];
  }, [countryCode, locations]);

  const selectedCountryOption = Math.max(
    0,
    countryOptions.findIndex((option) => option.value === countryCode),
  );
  const selectedCityOption = Math.max(
    0,
    cityOptions.findIndex((option) => option.value === city),
  );

  const selectedCampaignProfileRouteRole = useMemo(() => {
    const roles = (selectedCampaign?.filters?.currentRoles ?? []).map((role) =>
      String(role).toUpperCase(),
    );
    if (roles.length === 1 && roles[0] === "CLIENT") return "CLIENT";
    if (roles.length === 1 && roles[0] === "PROVIDER") return "PROVIDER";
    return "";
  }, [selectedCampaign]);

  const currentFilters = useMemo(() => buildFilters(), [buildFilters]);

  const fetchBootstrapData = useCallback(async () => {
    const [senderResponse, locationsResponse, appVersionsResponse] =
      await Promise.allSettled([
        getBroadcastNotificationSender(),
        getMarketplaceAnalyticsLocations(),
        getUsersAppVersionStats(),
      ]);

    if (senderResponse.status === "fulfilled") {
      const payload = senderResponse.value
        .data as BroadcastNotificationSenderResponse;
      setSender(payload.result ?? null);
    }

    if (locationsResponse.status === "fulfilled") {
      const payload = locationsResponse.value
        .data as GetMarketplaceAnalyticsLocationsResponse;
      setLocations(Array.isArray(payload.result) ? payload.result : []);
    }

    if (appVersionsResponse.status === "fulfilled") {
      const items = Array.isArray(appVersionsResponse.value.data?.items)
        ? appVersionsResponse.value.data.items
        : Array.isArray(appVersionsResponse.value.data?.result?.items)
          ? appVersionsResponse.value.data.result.items
          : [];
      setAvailableAppVersions(
        Array.from(
          new Set(
            items
              .map((item: { appVersion?: string }) => item.appVersion)
              .filter(
                (appVersion: unknown): appVersion is string =>
                  typeof appVersion === "string" &&
                  appVersion.trim().length > 0,
              ),
          ),
        ),
      );
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true);
      setError("");
      const response = await getBroadcastNotificationCampaigns({
        startIndex: campaignItemOffset,
        pageSize: PAGE_SIZE,
      });
      const payload =
        response.data as BroadcastNotificationCampaignsListResponse;
      const result = payload.result;
      const nextItems = Array.isArray(result?.items) ? result.items : [];
      const nextTotal = Number(result?.total ?? nextItems.length) || 0;
      const nextPageSize = Number(result?.pageSize ?? PAGE_SIZE) || PAGE_SIZE;

      setCampaigns(nextItems);
      setCampaignsTotal(nextTotal);
      setCampaignPageCount(Math.max(1, Math.ceil(nextTotal / nextPageSize)));
      setSelectedCampaignId((prev) => {
        if (prev && nextItems.some((item) => item.id === prev)) return prev;
        return nextItems[0]?.id ?? "";
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to load campaigns.",
        );
        return;
      }
      setError("Failed to load campaigns.");
    } finally {
      setCampaignsLoading(false);
    }
  }, [campaignItemOffset]);

  const fetchCampaignDetails = useCallback(async () => {
    if (!selectedCampaignId) {
      setRecipients([]);
      setRecipientsTotal(0);
      setRecipientPageCount(0);
      return;
    }

    if (!isRecipientsOpen) {
      return;
    }

    try {
      setCampaignDetailsLoading(true);
      setError("");
      const response = await getBroadcastNotificationCampaignById(
        selectedCampaignId,
        {
          startIndex: recipientItemOffset,
          pageSize: PAGE_SIZE,
          search: appliedRecipientSearch.trim() || undefined,
        },
      );
      const payload = response.data as
        | BroadcastNotificationCampaignDetailResponse
        | { result?: BroadcastNotificationCampaignDetailResponse["result"] };
      const result =
        (
          payload as {
            result?: BroadcastNotificationCampaignDetailResponse["result"];
          }
        ).result ??
        (payload as BroadcastNotificationCampaignDetailResponse).result;
      const nextCampaign = result?.campaign ?? null;
      const recipientsPage = result?.recipients;
      const nextRecipients = Array.isArray(recipientsPage?.items)
        ? recipientsPage.items
        : [];
      const nextTotal =
        Number(recipientsPage?.total ?? nextRecipients.length) || 0;
      const nextPageSize =
        Number(recipientsPage?.pageSize ?? PAGE_SIZE) || PAGE_SIZE;

      setSelectedCampaign(nextCampaign);
      setRecipients(nextRecipients);
      setRecipientsTotal(nextTotal);
      setRecipientPageCount(Math.max(1, Math.ceil(nextTotal / nextPageSize)));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to load campaign details.",
        );
        return;
      }
      setError("Failed to load campaign details.");
    } finally {
      setCampaignDetailsLoading(false);
    }
  }, [
    appliedRecipientSearch,
    isRecipientsOpen,
    recipientItemOffset,
    selectedCampaignId,
  ]);

  useEffect(() => {
    fetchBootstrapData();
  }, [fetchBootstrapData]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    fetchCampaignDetails();
  }, [fetchCampaignDetails]);

  useEffect(() => {
    let isCancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await previewBroadcastNotifications({
          filters: currentFilters,
        });
        const payload = response.data as
          | BroadcastNotificationPreviewResponse
          | { result?: BroadcastNotificationPreviewResponse["result"] };
        const result =
          (
            payload as {
              result?: BroadcastNotificationPreviewResponse["result"];
            }
          ).result ?? (payload as BroadcastNotificationPreviewResponse).result;

        if (isCancelled) return;
        setPreviewRecipientsCount(Number(result?.recipientsCount ?? 0) || 0);
        setPreviewRecipients([]);
      } catch {
        if (isCancelled) return;
        setPreviewRecipientsCount(null);
        setPreviewRecipients([]);
      }
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [currentFilters]);

  useEffect(() => {
    const summaryCampaign =
      campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;
    setSelectedCampaign(summaryCampaign);
    setRecipients([]);
    setRecipientsTotal(0);
    setRecipientPageCount(0);
    setRecipientItemOffset(0);
    setAppliedRecipientSearch("");
    setRecipientSearchText("");
    setIsRecipientsOpen(false);
  }, [campaigns, selectedCampaignId]);

  useEffect(() => {
    setCity("");
  }, [countryCode]);

  const handleToggleRole = (role: BroadcastNotificationRole) => {
    setCurrentRoles((prev) =>
      prev.includes(role)
        ? prev.filter((item) => item !== role)
        : [...prev, role],
    );
  };

  const handleToggleAppVersion = (appVersion: string) => {
    setSelectedAppVersions((prev) =>
      prev.includes(appVersion)
        ? prev.filter((item) => item !== appVersion)
        : [...prev, appVersion],
    );
  };

  const handlePreviewAudience = async () => {
    try {
      setPreviewLoading(true);
      setError("");
      const response = await previewBroadcastNotifications({
        filters: currentFilters,
      });
      const payload = response.data as
        | BroadcastNotificationPreviewResponse
        | { result?: BroadcastNotificationPreviewResponse["result"] };
      const result =
        (payload as { result?: BroadcastNotificationPreviewResponse["result"] })
          .result ?? (payload as BroadcastNotificationPreviewResponse).result;
      setPreviewRecipientsCount(Number(result?.recipientsCount ?? 0) || 0);
      setPreviewRecipients(
        Array.isArray(result?.sampleRecipients) ? result.sampleRecipients : [],
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { error?: string })?.error ??
          "Failed to preview recipients.";
        setError(message);
        toast.error(message);
        return;
      }
      setError("Failed to preview recipients.");
      toast.error("Failed to preview recipients.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!campaignText.trim() || sendLoading) return;

    try {
      setSendLoading(true);
      setError("");
      const response = await sendBroadcastNotifications({
        text: campaignText.trim(),
        filters: currentFilters,
      });
      const payload = response.data as {
        result?: { campaign?: BroadcastNotificationCampaign };
      };
      const campaignId = String(payload.result?.campaign?.id ?? "");

      toast.success("Campaign sent");
      setCampaignText("");
      setPreviewRecipientsCount(null);
      setPreviewRecipients([]);
      setCampaignItemOffset(0);
      await fetchCampaigns();
      if (campaignId) {
        setSelectedCampaignId(campaignId);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { error?: string })?.error ??
          "Failed to send campaign.";
        setError(message);
        toast.error(message);
        return;
      }
      setError("Failed to send campaign.");
      toast.error("Failed to send campaign.");
    } finally {
      setSendLoading(false);
    }
  };

  const handleCampaignPageClick = (event: { selected: number }) => {
    setCampaignItemOffset(event.selected * PAGE_SIZE);
  };

  const handleRecipientsPageClick = (event: { selected: number }) => {
    setRecipientItemOffset(event.selected * PAGE_SIZE);
  };

  const handleToggleRecipients = () => {
    if (!selectedCampaignId) return;
    if (isRecipientsOpen) {
      setIsRecipientsOpen(false);
      return;
    }
    setRecipientItemOffset(0);
    setAppliedRecipientSearch("");
    setRecipientSearchText("");
    setIsRecipientsOpen(true);
  };

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={`${styles.title} ${nunito.className}`}>Campaigns</h1>
          <div className={styles.subtitle}>{`${campaignsTotal} total, page ${
            campaignPageCount === 0
              ? 0
              : Math.floor(campaignItemOffset / PAGE_SIZE) + 1
          }/${campaignPageCount || 1}`}</div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.composeCard}>
        <div className={styles.composeHeader}>
          <div>
            <div className={styles.sectionTitle}>Create campaign</div>
            <div className={styles.sectionSubtitle}>
              Preview audience before sending a system chat message.
            </div>
          </div>
          {sender && (
            <div className={styles.senderCard}>
              <img
                className={styles.senderAvatar}
                src={sender.imgUrl || defaultAvatarImg.src}
                alt={sender.firstName || "System sender"}
              />
              <div>
                <div className={styles.senderTitle}>
                  {sender.firstName || "Nannow"}
                </div>
                <div className={styles.senderMeta}>{sender.email || "—"}</div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.filtersGrid}>
          <label className={styles.field}>
            <span>Country</span>
            <DropDownButton
              options={countryOptions}
              selectedOption={selectedCountryOption}
              setSelectedOption={(nextSelectedOption) => {
                const option = countryOptions[nextSelectedOption as number];
                if (!option) return;
                setCountryCode(option.value);
              }}
            />
          </label>
          <label className={styles.field}>
            <span>City</span>
            <DropDownButton
              options={cityOptions}
              selectedOption={selectedCityOption}
              setSelectedOption={(nextSelectedOption) => {
                const option = cityOptions[nextSelectedOption as number];
                if (!option) return;
                setCity(option.value);
              }}
            />
          </label>

          <label className={styles.field}>
            <span>Language</span>
            <DropDownButton
              options={LANGUAGE_OPTIONS}
              selectedOption={Math.max(
                0,
                LANGUAGE_OPTIONS.findIndex(
                  (option) => option.value === language,
                ),
              )}
              setSelectedOption={(nextSelectedOption) => {
                const option = LANGUAGE_OPTIONS[nextSelectedOption as number];
                if (!option) return;

                setLanguage(option.value);
              }}
            />
          </label>
          <label className={styles.field}>
            <span>Onboarding</span>
            <DropDownButton
              options={BOOLEAN_FILTER_OPTIONS.map((option) => ({
                title:
                  option.value === "all"
                    ? "All"
                    : option.value === "true"
                      ? "Finished"
                      : "Not finished",
                value: option.value,
              }))}
              selectedOption={BOOLEAN_FILTER_OPTIONS.findIndex(
                (option) => option.value === onboardingFinishedFilter,
              )}
              setSelectedOption={(nextSelectedOption) => {
                const option =
                  BOOLEAN_FILTER_OPTIONS[nextSelectedOption as number];
                if (!option) return;
                setOnboardingFinishedFilter(option.value);
              }}
            />
          </label>
          <label className={styles.field}>
            <span>Profile image</span>
            <DropDownButton
              options={BOOLEAN_FILTER_OPTIONS.map((option) => ({
                title:
                  option.value === "all"
                    ? "All"
                    : option.value === "true"
                      ? "Added"
                      : "Missing",
                value: option.value,
              }))}
              selectedOption={BOOLEAN_FILTER_OPTIONS.findIndex(
                (option) => option.value === profileImageFilter,
              )}
              setSelectedOption={(nextSelectedOption) => {
                const option =
                  BOOLEAN_FILTER_OPTIONS[nextSelectedOption as number];
                if (!option) return;
                setProfileImageFilter(option.value);
              }}
            />
          </label>
          <label className={styles.field}>
            <span>Activity number</span>
            <DropDownButton
              options={BOOLEAN_FILTER_OPTIONS.map((option) => ({
                title:
                  option.value === "all"
                    ? "All"
                    : option.value === "true"
                      ? "Has number"
                      : "No number",
                value: option.value,
              }))}
              selectedOption={BOOLEAN_FILTER_OPTIONS.findIndex(
                (option) => option.value === activityNumberFilter,
              )}
              setSelectedOption={(nextSelectedOption) => {
                const option =
                  BOOLEAN_FILTER_OPTIONS[nextSelectedOption as number];
                if (!option) return;
                setActivityNumberFilter(option.value);
              }}
            />
          </label>
          <label className={styles.field}>
            <span>Children min</span>
            <input
              type="number"
              min="0"
              value={childQtyMin}
              onChange={(event) => setChildQtyMin(event.target.value)}
              placeholder="0"
            />
          </label>
          <label className={styles.field}>
            <span>Children max</span>
            <input
              type="number"
              min="0"
              value={childQtyMax}
              onChange={(event) => setChildQtyMax(event.target.value)}
              placeholder="0"
            />
          </label>
          <label className={styles.field}>
            <span>Rating min</span>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={generalRatingMin}
              onChange={(event) => setGeneralRatingMin(event.target.value)}
              placeholder="0"
            />
          </label>
          <label className={styles.field}>
            <span>Rating max</span>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={generalRatingMax}
              onChange={(event) => setGeneralRatingMax(event.target.value)}
              placeholder="5"
            />
          </label>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>Roles</div>
          <div className={styles.pillsRow}>
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role}
                type="button"
                className={`${styles.pillButton} ${
                  currentRoles.includes(role) ? styles.pillButtonActive : ""
                }`}
                onClick={() => handleToggleRole(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {availableAppVersions.length > 0 && (
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>App versions</div>
            <div className={styles.pillsRow}>
              {availableAppVersions.map((appVersion) => (
                <button
                  key={appVersion}
                  type="button"
                  className={`${styles.pillButton} ${
                    selectedAppVersions.includes(appVersion)
                      ? styles.pillButtonActive
                      : ""
                  }`}
                  onClick={() => handleToggleAppVersion(appVersion)}
                >
                  {appVersion}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className={styles.textareaField}>
          <span>Message text</span>
          <textarea
            value={campaignText}
            onChange={(event) => setCampaignText(event.target.value)}
            placeholder="Enter campaign message"
          />
        </label>

        <div className={styles.composeActions}>
          <Button
            title={
              previewLoading
                ? "Previewing..."
                : typeof previewRecipientsCount === "number"
                  ? `Preview audience (${previewRecipientsCount})`
                  : "Preview audience"
            }
            type="OUTLINED"
            onClick={handlePreviewAudience}
            isDisabled={previewLoading}
            isLoading={previewLoading}
          />
          <Button
            title={sendLoading ? "Sending..." : "Send campaign"}
            type="BLACK"
            onClick={handleSendCampaign}
            isDisabled={sendLoading || campaignText.trim().length === 0}
            isLoading={sendLoading}
          />
        </div>

        <div className={styles.previewCard}>
          <div className={styles.previewCount}>
            {previewRecipientsCount === null
              ? "Preview recipients count"
              : `${previewRecipientsCount} recipients selected`}
          </div>
          <div className={styles.previewFilters}>
            {formatFiltersSummary(currentFilters)}
          </div>
          {previewRecipients.length > 0 && (
            <div className={styles.previewRecipients}>
              {previewRecipients.map((recipient) => {
                const previewRoute =
                  recipient.currentMode === "PROVIDER"
                    ? `/provider/${recipient.id}`
                    : recipient.currentMode === "CLIENT"
                      ? `/client/${recipient.id}`
                      : "";
                const content = (
                  <>
                    <img
                      className={styles.previewRecipientAvatar}
                      src={recipient.imgUrl || defaultAvatarImg.src}
                      alt={getUserDisplayName(
                        recipient.firstName,
                        recipient.lastName,
                      )}
                    />
                    <div>
                      <div className={styles.previewRecipientName}>
                        {getUserDisplayName(
                          recipient.firstName,
                          recipient.lastName,
                        )}
                      </div>
                      <div className={styles.previewRecipientMeta}>
                        {`${recipient.currentMode ?? "USER"} • ${recipient.city ?? "—"} • ${
                          recipient.appVersion ?? "No app version"
                        }`}
                      </div>
                    </div>
                  </>
                );

                return previewRoute ? (
                  <Link
                    key={`${recipient.id}-${recipient.currentMode}`}
                    href={previewRoute}
                    className={styles.previewRecipientRow}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={`${recipient.id}-${recipient.currentMode}`}
                    className={styles.previewRecipientRow}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className={styles.layout}>
        <section className={styles.historyPane}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Campaign history</div>
              <div className={styles.sectionSubtitle}>
                Open a campaign to inspect recipients.
              </div>
            </div>
          </div>
          <div className={styles.historyList}>
            {campaignsLoading ? (
              <div className={styles.emptyState}>Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className={styles.emptyState}>No campaigns yet</div>
            ) : (
              campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  className={`${styles.historyRow} ${
                    selectedCampaignId === campaign.id
                      ? styles.historyRowActive
                      : ""
                  }`}
                  onClick={() => setSelectedCampaignId(campaign.id)}
                >
                  <div className={styles.historyRowTop}>
                    <div className={styles.historyText}>{campaign.text}</div>
                    <div className={styles.historyDate}>
                      {formatDateTime(campaign.sentAt)}
                    </div>
                  </div>
                  <div className={styles.historyMeta}>
                    {`${campaign.deliveredRecipientsCount}/${campaign.targetedRecipientsCount} sent • ${campaign.readRecipientsCount} read • ${campaign.pushSuccessCount} push ok • ${campaign.pushFailureCount} push fail`}
                  </div>
                  <div className={styles.historyMeta}>
                    {formatFiltersSummary(campaign.filters)}
                  </div>
                </button>
              ))
            )}
          </div>
          {campaignPageCount > 1 && (
            <ReactPaginate
              className={paginateStyles.pagination}
              breakLabel="..."
              nextLabel=">"
              onPageChange={handleCampaignPageClick}
              pageRangeDisplayed={5}
              pageCount={campaignPageCount}
              previousLabel="<"
              forcePage={campaignItemOffset / PAGE_SIZE}
              renderOnZeroPageCount={null}
            />
          )}
        </section>

        <section className={styles.detailPane}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Campaign details</div>
              <div className={styles.sectionSubtitle}>
                {selectedCampaign
                  ? `${selectedCampaign.readRecipientsCount} read / ${selectedCampaign.unreadRecipientsCount} unread`
                  : "Select a campaign"}
              </div>
            </div>
            {selectedCampaign && isRecipientsOpen && (
              <SearchBar
                placeholder="Search recipient"
                searchText={recipientSearchText}
                setSearchText={setRecipientSearchText}
                onButtonClick={() => {
                  setRecipientItemOffset(0);
                  setAppliedRecipientSearch(recipientSearchText);
                }}
              />
            )}
          </div>

          {campaignDetailsLoading ? (
            <div className={styles.emptyState}>Loading campaign details...</div>
          ) : !selectedCampaign ? (
            <div className={styles.emptyState}>
              Select a campaign to view recipients
            </div>
          ) : (
            <>
              <div className={styles.detailSummary}>
                <div className={styles.summaryCard}>
                  <span>Recipients</span>
                  <strong>{selectedCampaign.targetedRecipientsCount}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span>Created by</span>
                  <strong>{selectedCampaign.createdByAdminName || "—"}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span>Created at</span>
                  <strong>{formatDateTime(selectedCampaign.createdAt)}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span>Delivered</span>
                  <strong>{selectedCampaign.deliveredRecipientsCount}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span>Read</span>
                  <strong>{selectedCampaign.readRecipientsCount}</strong>
                </div>
              </div>

              <div className={styles.campaignTextCard}>
                {selectedCampaign.text}
              </div>
              <div className={styles.detailFilters}>
                {formatFiltersSummary(selectedCampaign.filters)}
              </div>
              <div className={styles.recipientActions}>
                <Button
                  title={
                    isRecipientsOpen
                      ? "Hide recipients"
                      : `Open recipients (${selectedCampaign.targetedRecipientsCount})`
                  }
                  type="OUTLINED"
                  onClick={handleToggleRecipients}
                />
              </div>

              {isRecipientsOpen && (
                <>
                  <div className={styles.recipientList}>
                    {campaignDetailsLoading ? (
                      <div className={styles.emptyState}>
                        Loading recipients...
                      </div>
                    ) : recipients.length === 0 ? (
                      <div className={styles.emptyState}>
                        No recipients found
                      </div>
                    ) : (
                      recipients.map((recipient) => {
                        const profileRoute =
                          selectedCampaignProfileRouteRole === "PROVIDER"
                            ? `/provider/${recipient.userId}`
                            : selectedCampaignProfileRouteRole === "CLIENT"
                              ? `/client/${recipient.userId}`
                              : "";
                        const content = (
                          <>
                            <img
                              className={styles.recipientAvatar}
                              src={
                                recipient.user?.imgUrl || defaultAvatarImg.src
                              }
                              alt={getUserDisplayName(
                                recipient.user?.firstName,
                                recipient.user?.lastName,
                              )}
                            />
                            <div className={styles.recipientMain}>
                              <div className={styles.recipientName}>
                                {getUserDisplayName(
                                  recipient.user?.firstName,
                                  recipient.user?.lastName,
                                )}
                              </div>
                              <div className={styles.recipientMeta}>
                                {recipient.user?.email || recipient.userId}
                              </div>
                              <div className={styles.recipientMeta}>
                                {`Delivery: ${recipient.deliveryStatus ?? "—"} • Push: ${recipient.pushStatus ?? "—"} • Read: ${recipient.isRead ? "Yes" : "No"}`}
                              </div>
                            </div>
                            <div className={styles.recipientDate}>
                              {formatDateTime(recipient.createdAt)}
                            </div>
                          </>
                        );

                        return profileRoute ? (
                          <Link
                            key={recipient.id}
                            href={profileRoute}
                            className={styles.recipientRow}
                          >
                            {content}
                          </Link>
                        ) : (
                          <div
                            key={recipient.id}
                            className={styles.recipientRow}
                          >
                            {content}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {recipientPageCount > 1 && (
                    <ReactPaginate
                      className={paginateStyles.pagination}
                      breakLabel="..."
                      nextLabel=">"
                      onPageChange={handleRecipientsPageClick}
                      pageRangeDisplayed={5}
                      pageCount={recipientPageCount}
                      previousLabel="<"
                      forcePage={recipientItemOffset / PAGE_SIZE}
                      renderOnZeroPageCount={null}
                    />
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Campaigns;
