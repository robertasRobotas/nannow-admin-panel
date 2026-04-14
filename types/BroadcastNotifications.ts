export type BroadcastNotificationRole = "CLIENT" | "PROVIDER";

export type BroadcastNotificationFilters = {
  country?: string;
  city?: string;
  currentRoles?: BroadcastNotificationRole[];
  isOnboardingFinished?: boolean;
  isProfilePictureAdded?: boolean;
  childQtyMin?: number;
  childQtyMax?: number;
  hasActivityNumber?: boolean;
  appVersions?: string[];
  generalRatingMin?: number;
  generalRatingMax?: number;
  language?: string;
};

export type BroadcastNotificationPreviewRecipient = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imgUrl: string | null;
  currentMode: BroadcastNotificationRole | string | null;
  pushToken?: string | null;
  appVersion?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  city?: string | null;
  childQty?: number | null;
  hasActivityNumber?: boolean | null;
  generalRating?: number | null;
  isOnboardingFinished?: boolean | null;
  isProfilePictureAdded?: boolean | null;
  languages?: string[] | null;
};

export type BroadcastNotificationPreviewResponse = {
  result: {
    filters: BroadcastNotificationFilters;
    recipientsCount: number;
    sampleRecipients: BroadcastNotificationPreviewRecipient[];
  };
};

export type BroadcastNotificationSender = {
  id: string;
  firstName: string | null;
  imgUrl: string | null;
  email: string | null;
};

export type BroadcastNotificationCampaign = {
  id: string;
  text: string;
  filters: BroadcastNotificationFilters;
  createdByAdminId: string;
  createdByAdminName: string;
  systemSenderUserId: string;
  previewRecipientsCount: number;
  targetedRecipientsCount: number;
  deliveredRecipientsCount: number;
  pushSuccessCount: number;
  pushFailureCount: number;
  createdAt: string;
  sentAt: string | null;
  readRecipientsCount: number;
  unreadRecipientsCount: number;
};

export type BroadcastNotificationCampaignRecipient = {
  id: string;
  campaignId: string;
  userId: string;
  chatId: string | null;
  messageId: string | null;
  deliveryStatus: string | null;
  deliveryError: string | null;
  pushTokenExists: boolean;
  pushStatus: string | null;
  pushError: string | null;
  createdAt: string;
  isRead: boolean;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imgUrl: string | null;
  };
};

export type BroadcastNotificationRecipientsPage = {
  items: BroadcastNotificationCampaignRecipient[];
  total: number;
  startIndex: number;
  pageSize: number;
  hasMore: boolean;
};

export type BroadcastNotificationCampaignsListResponse = {
  result: {
    items: BroadcastNotificationCampaign[];
    total: number;
    startIndex: number;
    pageSize: number;
    hasMore: boolean;
  };
};

export type BroadcastNotificationCampaignDetailResponse = {
  result: {
    campaign: BroadcastNotificationCampaign;
    recipients: BroadcastNotificationRecipientsPage;
  };
};

export type BroadcastNotificationSendResponse = {
  result: {
    campaign: BroadcastNotificationCampaign;
    recipients: BroadcastNotificationRecipientsPage;
  };
};

export type BroadcastNotificationSenderResponse = {
  result: BroadcastNotificationSender;
};
