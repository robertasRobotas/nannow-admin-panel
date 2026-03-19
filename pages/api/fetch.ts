import axios from "axios";

import Cookies from "js-cookie";

// export const BASE_URL = "https://nannow-api-test.com/v1";
export const BASE_URL = "https://nannow-api.com/v1";
// export const BASE_URL = "http://192.168.1.192:8080/v1";
// const BASE_URL = "http://localhost:8080";

export type AdminRole = "ADMIN" | "SUPER_ADMIN";
export type SuperAccessEntity =
  | "admins"
  | "users"
  | "clients"
  | "children"
  | "providers"
  | "addresses"
  | "orders";

export type AdminUserPayload = {
  id?: string;
  _id?: string;
  email: string;
  firstName?: string;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export const login = async (loginData: { email: string; password: string }) => {
  const response = await axios.post(`${BASE_URL}/admin-user/login`, loginData);

  return response;
};

export const loginWithFirebase = async (firebaseIdToken: string) => {
  const response = await axios.post(
    `${BASE_URL}/admin-user/login/firebase`,
    {},
    {
      headers: {
        Authorization: firebaseIdToken,
      },
    },
  );
  return response;
};

export const verifyAdminLoginTotp = async (mfaToken: string, code: string) => {
  const response = await axios.post(
    `${BASE_URL}/admin-user/login/2fa/totp/verify`,
    {
      mfaToken,
      code,
    },
  );
  return response;
};

export const setupAdminTotp = async (authToken?: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin-user/2fa/totp/setup`,
    {},
    {
      headers: {
        Authorization: authToken ?? jwt,
      },
    },
  );
  return response;
};

export const verifyAdminTotpSetup = async (code: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin-user/2fa/totp/verify-setup`,
    { code },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getAllUsers = async (url: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/${url}`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getClientById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/clients/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getProviderById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/providers/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const regenerateAddressPublicLocation = async (
  id: string,
  payload: {
    minDistanceMeters: number;
    maxDistanceMeters: number;
  },
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin/addresses/${id}/regenerate-public-location`,
    payload,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const regenerateAllAddressesPublicLocation = async (payload: {
  minDistanceMeters: number;
  maxDistanceMeters: number;
}) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin/addresses/regenerate-public-location`,
    payload,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getUsersByCriminalRecordStatus = async (
  status: string,
  startIndex: number,
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/criminal-record-status/users?startIndex=${startIndex}&status=${status}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getCriminalCheckById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/criminal-record-status/users/${id}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getPendingCriminalRecordCount = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/criminal-record-status/pending/count`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getPendingProviderSpecialSkillsCount = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/provider-special-skills/pending/count`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getNotReviewedDocumentsCount = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/documents/not-reviewed/count`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getNotResolvedReportsCount = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/reports/not-resolved/count`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getNotResolvedFeedbackCount = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/feedback/not-resolved/count`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const updateCriminalCheckStatus = async (id: string, status: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/criminal-record-status/users/${id}`,
    { status: status },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const parseJwtPayload = (token?: string) => {
  try {
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const getCurrentAdminRolesFromJwt = (): AdminRole[] => {
  const jwt = Cookies.get("@user_jwt");
  const payload = parseJwtPayload(jwt);

  const candidateRoles = [
    ...(Array.isArray(payload?.roles) ? payload.roles : []),
    ...(Array.isArray(payload?.admin?.roles) ? payload.admin.roles : []),
    ...(payload?.role ? [payload.role] : []),
  ];
  return Array.from(
    new Set(
      candidateRoles.filter(
        (role): role is AdminRole => role === "ADMIN" || role === "SUPER_ADMIN",
      ),
    ),
  );
};

const getAdminIdFromJwt = () => {
  const jwt = Cookies.get("@user_jwt");
  const payload = parseJwtPayload(jwt);
  return (
    payload?.adminId ?? payload?.id ?? payload?.userId ?? payload?.sub ?? ""
  );
};

export const applyCriminalRecordApplicationDecision = async (
  userId: string,
  payload: {
    applicationId: string;
    decision:
      | "APPROVE_AND_SET_CURRENT"
      | "REJECT_AND_SET_CURRENT"
      | "REJECT_HISTORY_ONLY"
      | "SET_PENDING_CURRENT"
      | "SET_NOT_SUBMITTED_CURRENT";
    criminalRejectionText?: string;
    documentIds?: string[];
  },
) => {
  const jwt = Cookies.get("@user_jwt");
  const adminId = getAdminIdFromJwt();
  const response = await axios.put(
    `${BASE_URL}/admin/criminal-record-status/users/${userId}`,
    {
      adminId,
      applicationId: payload.applicationId,
      decision: payload.decision,
      criminalRejectionText: payload.criminalRejectionText,
      documentIds: payload.documentIds ?? [],
    },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const addCriminalCheckNote = async (id: string, note: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin/criminal-record-status/users/${id}/admin-notes`,
    { note: note },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const updateReportStatus = async (id: string, isSolved: boolean) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/reports/${id}`,
    {
      isResolved: isSolved,
    },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const setUserSuspendedStatus = async (
  id: string,
  isSuspended: boolean,
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/users/${id}/suspend`,
    { isSuspended },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const setUserBanStatus = async (
  userId: string,
  isBanned: boolean,
  bannedReason?: string,
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/users/${userId}/ban`,
    {
      isBanned,
      bannedReason,
    },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getBannedUsers = async (params?: {
  search?: string;
  startIndex?: number;
  pageSize?: number;
}) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/users/banned`, {
    params: {
      search: params?.search,
      startIndex: params?.startIndex ?? 0,
      pageSize: params?.pageSize ?? 20,
    },
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const deleteProviderStripeAccount = async (userId: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.delete(
    `${BASE_URL}/admin/providers/${userId}/stripe-account`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );

  return response;
};

export const updateProviderFields = async (
  providerId: string,
  updates: {
    baseProviderRate?: number;
  },
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/providers/${providerId}/fields`,
    { updates },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );

  return response;
};

export const updateFeedbackStatus = async (id: string, isSolved: boolean) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/feedback/${id}`,
    {
      isResolved: isSolved,
    },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getChatById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/chats/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getAllReports = async (startIndex: number) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/reports?startIndex=${startIndex}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getReportById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/reports/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getAllReviews = async (
  startIndex: number,
  rating?: number | string,
) => {
  const jwt = Cookies.get("@user_jwt");
  const ratingQuery =
    rating !== undefined && `${rating}`.length > 0 ? `&rating=${rating}` : "";
  const response = await axios.get(
    `${BASE_URL}/admin/reviews?startIndex=${startIndex}${ratingQuery}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getReviewById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/reviews/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getAllFeedback = async (startIndex: number) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/feedback?startIndex=${startIndex}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getFeedbackById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/feedback/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getCriminalRecordInfo = async (code: string) => {
  const response = await axios.get(
    `https://epaslaugos.ird.lt/vrmeport-api/rest/public/get-f200/${code}`,
  );
  return response;
};

export const getOrders = async (status: string, startIndex: number) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/orders?startIndex=${startIndex}&status=${status}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getProviderPayouts = async (params: {
  userId: string;
  startIndex?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/payouts`, {
    params: {
      userId: params.userId,
      startIndex: params.startIndex ?? 0,
      pageSize: params.pageSize ?? 20,
      startDate: params.startDate,
      endDate: params.endDate,
    },
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getClientPayments = async (params: {
  userId: string;
  startIndex?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/payments`, {
    params: {
      userId: params.userId,
      startIndex: params.startIndex ?? 0,
      pageSize: params.pageSize ?? 20,
      startDate: params.startDate,
      endDate: params.endDate,
    },
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getInvoices = async (params?: {
  startIndex?: number;
  pageSize?: number;
  ownerUserId?: string;
  ownerRole?: "CLIENT" | "PROVIDER";
  orderId?: string;
  kind?: "PLATFORM_FEE_INVOICE" | "PROVIDER_INVOICE" | "PROVIDER_RECEIPT";
}) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/invoices`, {
    params: {
      startIndex: params?.startIndex ?? 0,
      pageSize: params?.pageSize ?? 20,
      ownerUserId: params?.ownerUserId,
      ownerRole: params?.ownerRole,
      orderId: params?.orderId,
      kind: params?.kind,
    },
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getNotFinishedOnboardingUsers = async (params?: {
  mode?: "CLIENT" | "PROVIDER";
  search?: string;
  startIndex?: number;
  pageSize?: number;
}) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/users/onboarding/not-finished`,
    {
      params: {
        mode: params?.mode,
        search: params?.search,
        startIndex: params?.startIndex ?? 0,
        pageSize: params?.pageSize ?? 20,
      },
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const refreshPayoutByOrderId = async (orderId: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin/payouts/refresh`,
    { orderId },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getNotPaidOrders = async (status: string, startIndex: number) => {
  const jwt = Cookies.get("@user_jwt");
  const filters = encodeURIComponent(
    JSON.stringify({ isReleasedFundsToProvider: { $ne: true } }),
  );

  const response = await axios.get(
    `${BASE_URL}/admin/orders?startIndex=${startIndex}&status=PROVIDER_MARKED_AS_SERVICE_ENDED&filters=${filters}`,
    {
      headers: { Authorization: jwt },
    },
  );
  return response;
};

export const getNotEndedOrdersCount = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/orders/not-ended/count`, {
    headers: {
      Authorization: jwt,
    },
  });
  console.log(response);
  return response;
};

export const getNotPaidOrdersCount = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/orders/not-paid/count`, {
    headers: {
      Authorization: jwt,
    },
  });
  console.log(response);
  return response;
};

export const getOrderById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/orders/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getClosedOrders = async (startIndex = 0) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/orders/closed?startIndex=${startIndex}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getOrderInvoice = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/orders/${id}/invoice`, {
    headers: {
      Authorization: jwt,
    },
    responseType: "blob",
  });
  return response;
};

export const getOrderProviderInvoice = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/orders/${id}/provider-invoice`,
    {
      headers: {
        Authorization: jwt,
      },
      responseType: "blob",
    },
  );
  return response;
};

export const getOrderProviderReceipt = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/orders/${id}/provider-receipt`,
    {
      headers: {
        Authorization: jwt,
      },
      responseType: "blob",
    },
  );
  return response;
};

export const releaseFundsByOrderId = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/orders/${id}/release-funds`,
    {},
    {
      headers: {
        Authorization: jwt,
      },
    },
  );

  return response;
};

export const refundOrderById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/orders/${id}/refund`,
    {},
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const payoutCancelFeeByOrderId = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/orders/${id}/cancel-fee-payout`,
    {},
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getCanceledPendingFinancialOrdersCount = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/orders/canceled-financial-pending/count`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getCanceledPendingFinancialOrders = async (
  startIndex = 0,
  pageSize = 20,
) => {
  const jwt = Cookies.get("@user_jwt");
  const statuses = ["CLIENT_CANCELED", "CANCELED_BY_CLIENT"];
  const byId = new Map<string, unknown>();

  for (const status of statuses) {
    let cursor = 0;
    let total = 0;
    let apiPageSize = 100;

    do {
      const response = await axios.get(
        `${BASE_URL}/admin/orders?startIndex=${cursor}&status=${status}`,
        {
          headers: {
            Authorization: jwt,
          },
        },
      );

      const result = response.data?.result ?? {};
      const items = Array.isArray(result.items) ? result.items : [];
      total = Number(result.total ?? 0);
      apiPageSize = Number(result.pageSize ?? apiPageSize);

      for (const order of items) {
        const orderId = String((order as { id?: unknown })?.id ?? "");
        if (!orderId || byId.has(orderId)) continue;

        const statusUpper = String(
          (order as { status?: unknown })?.status ?? "",
        ).toUpperCase();
        const paymentStatusUpper = String(
          (order as { paymentStatus?: unknown })?.paymentStatus ?? "",
        ).toUpperCase();
        const isCanceledByClient =
          statusUpper === "CANCELED_BY_CLIENT" ||
          statusUpper === "CLIENT_CANCELED";
        if (!isCanceledByClient) continue;
        if (paymentStatusUpper === "PAID") continue;

        const isLate2 = !!(
          order as { isOrderCanceledLessThan2hBeforeStart?: unknown }
        )?.isOrderCanceledLessThan2hBeforeStart;
        const isLate12 =
          !!(order as { isOrderCanceledLessThan12hBeforeStart?: unknown })
            ?.isOrderCanceledLessThan12hBeforeStart && !isLate2;
        const isRefundDone = !!(order as { refundedAt?: unknown })?.refundedAt;
        const isPayoutDone = !!(
          order as { isCancelFeePaidToProvider?: unknown }
        )?.isCancelFeePaidToProvider;

        const isFinancialPending = isLate2
          ? !isPayoutDone
          : isLate12
            ? !isRefundDone || !isPayoutDone
            : !isRefundDone;
        if (!isFinancialPending) continue;

        byId.set(orderId, order);
      }

      cursor += apiPageSize;
    } while (cursor < total);
  }

  const allItems = Array.from(byId.values()).sort((a, b) => {
    const aCreated = String((a as { createdAt?: unknown })?.createdAt ?? "");
    const bCreated = String((b as { createdAt?: unknown })?.createdAt ?? "");
    return bCreated.localeCompare(aCreated);
  });

  const pagedItems = allItems.slice(startIndex, startIndex + pageSize);
  return {
    data: {
      result: {
        items: pagedItems,
        total: allItems.length,
        pageSize,
        startIndex,
      },
    },
  };
};

export const finishOrderByAdmin = async (
  id: string,
  resolvedReason: string,
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/orders/${id}/finish`,
    { resolvedReason },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const closeOrderByAdmin = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/orders/${id}/close`,
    {},
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const openOrderByAdmin = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/orders/${id}/open`,
    {},
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const cancelOrderByAdmin = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/orders/${id}/cancel`,
    {},
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const toggleProviderBadge = async (
  providerUserId: string,
  badge: string,
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin/provider/badges`,
    { providerUserId, badge },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const toggleDocumentReviewed = async (documentId: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/documents/${documentId}/review`,
    {},
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getDocumentById = async (documentId: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/documents/${documentId}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getDocuments = async (
  startIndex: number,
  status?: "REVIEWED" | "NOT_REVIEWED",
) => {
  const jwt = Cookies.get("@user_jwt");
  const statusQuery = status ? `&status=${status}` : "";
  const response = await axios.get(
    `${BASE_URL}/admin/documents?startIndex=${startIndex}${statusQuery}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const reviewSpecialSkill = async (
  providerId: string,
  skillName: string,
  status: "APPROVED" | "REJECTED" | "PENDING",
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin/provider/${providerId}/special-skills/${skillName}/review`,
    { status },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const toggleUserVerified = async (userId: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/users/${userId}/verify`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const addReviewByAdmin = async (
  orderId: string,
  payload: {
    generalRating: number;
    punctualityRating?: number;
    empathyRating?: number;
    communicationRating?: number;
    cleanlinessRating?: number;
    text?: string;
    clientId: string;
    providerId: string;
    textCreatedAt?: string | Date;
  },
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin/reviews/${orderId}`,
    payload,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const deleteProviderBookingSlot = async (
  providerId: string,
  orderId: string,
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.delete(
    `${BASE_URL}/admin/providers/${providerId}/booking-slots/${orderId}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const deleteUser = async (userId: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.delete(`${BASE_URL}/admin/users/${userId}`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getAllAdmins = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin-user`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getConnectedAdmins = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/users/connected-admins`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const postAdminMessage = async (text: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin/messages`,
    { text },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getAdminMessages = async ({
  startIndex = 0,
  pageSize = 20,
}: {
  startIndex?: number;
  pageSize?: number;
}) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/messages?startIndex=${startIndex}&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getUnreadAdminMessagesCount = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/messages/unread-count`, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const markAdminMessageRead = async (messageId: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin/messages/${messageId}/read`,
    {},
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const markAllAdminMessagesRead = async () => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(
    `${BASE_URL}/admin/messages/read-all`,
    {},
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const createAdminUser = async (payload: {
  email: string;
  firstName: string;
  password?: string;
  roles: AdminRole[];
}) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.post(`${BASE_URL}/admin-user`, payload, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const updateAdminUser = async (
  adminId: string,
  payload: {
    firstName?: string;
    email?: string;
    password?: string | null;
    roles?: AdminRole[];
  },
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin-user/${adminId}`,
    payload,
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const updateAdminUserRoles = async (
  adminId: string,
  roles: AdminRole[],
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.put(
    `${BASE_URL}/admin-user/${adminId}/roles`,
    { roles },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};

export const getSuperAccessList = async (
  entity: SuperAccessEntity,
  params?: { startIndex?: number; pageSize?: number; search?: string },
) => {
  const jwt = Cookies.get("@user_jwt");
  const url =
    entity === "admins"
      ? `${BASE_URL}/admin-user`
      : `${BASE_URL}/admin/super/${entity}`;
  const response = await axios.get(url, {
    params: {
      startIndex: params?.startIndex ?? 0,
      pageSize: params?.pageSize ?? 20,
      search: params?.search,
    },
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const getSuperAccessItem = async (
  entity: SuperAccessEntity,
  id: string,
) => {
  const jwt = Cookies.get("@user_jwt");
  const url =
    entity === "admins"
      ? `${BASE_URL}/admin-user/${id}`
      : `${BASE_URL}/admin/super/${entity}/${id}`;
  const response = await axios.get(url, {
    headers: {
      Authorization: jwt,
    },
  });
  return response;
};

export const updateSuperAccessItem = async (
  entity: SuperAccessEntity,
  id: string,
  updates: Record<string, unknown>,
) => {
  const jwt = Cookies.get("@user_jwt");
  const url =
    entity === "admins"
      ? `${BASE_URL}/admin-user/${id}`
      : `${BASE_URL}/admin/super/${entity}/${id}`;
  const response = await axios.put(
    url,
    entity === "admins" ? updates : { updates },
    {
      headers: {
        Authorization: jwt,
      },
    },
  );
  return response;
};
