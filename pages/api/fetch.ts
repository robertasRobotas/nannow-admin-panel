import axios from "axios";

import Cookies from "js-cookie";

const BASE_URL = "https://nannow-api.com/v1";
// const BASE_URL = "http://192.168.1.192:8080/v1";
// const BASE_URL = "http://localhost:8080";

export const login = async (loginData: { email: string; password: string }) => {
  const response = await axios.post(`${BASE_URL}/admin-user/login`, loginData);

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

const parseJwtPayload = (token?: string) => {
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
