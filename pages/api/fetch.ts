import axios from "axios";

import Cookies from "js-cookie";

const BASE_URL = "https://nannow-api.com";
//const BASE_URL = "http://192.168.1.192:8080";

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
  console.log(response);
  return response;
};

export const getClientById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/clients/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  console.log(response);
  return response;
};

export const getUsersByCriminalRecordStatus = async (
  status: string,
  startIndex: number
) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/criminal-record-status/users?startIndex=${startIndex}&status=${status}`,
    {
      headers: {
        Authorization: jwt,
      },
    }
  );
  console.log(response);
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
    }
  );
  console.log(response);
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
    }
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
    }
  );
  console.log(response);
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
    }
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
    }
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
  console.log(response);
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
    }
  );
  console.log(response);
  return response;
};

export const getReportById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/reports/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  console.log(response);
  return response;
};

export const getAllReviews = async (startIndex: number) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(
    `${BASE_URL}/admin/reviews?startIndex=${startIndex}`,
    {
      headers: {
        Authorization: jwt,
      },
    }
  );
  console.log(response);
  return response;
};

export const getReviewById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/reviews/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  console.log(response);
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
    }
  );
  console.log(response);
  return response;
};

export const getFeedbackById = async (id: string) => {
  const jwt = Cookies.get("@user_jwt");
  const response = await axios.get(`${BASE_URL}/admin/feedback/${id}`, {
    headers: {
      Authorization: jwt,
    },
  });
  console.log(response);
  return response;
};

export const getCriminalRecordInfo = async (code: string) => {
  const response = await axios.get(
    `https://epaslaugos.ird.lt/vrmeport-api/rest/public/get-f200/${code}`
  );
  console.log(response);
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
    }
  );
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
  console.log(response);
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
    }
  );

  return response;
};
