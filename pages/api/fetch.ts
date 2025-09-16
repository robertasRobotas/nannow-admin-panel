import axios from "axios";

const BASE_URL = "https://nannow-api.com";

export const getAllUsers = async (url: string) => {
  const response = await axios.get(`${BASE_URL}/${url}`);
  console.log(response);
  return response;
};

export const getClientById = async (id: string) => {
  const response = await axios.get(`${BASE_URL}/admin/clients/${id}`);
  console.log(response);
  return response;
};

export const getUsersByCriminalRecordStatus = async (status: string) => {
  const response = await axios.get(
    `${BASE_URL}/admin/users-by-criminal-record-status?startIndex=&status=${status}`
  );
  console.log(response);
  return response;
};

export const getCriminalCheckById = async (id: string) => {
  const response = await axios.get(
    `${BASE_URL}/admin/users/${id}/criminal-record-info`
  );
  console.log(response);
  return response;
};

export const updateCriminalCheckStatus = async (id: string, status: string) => {
  const response = await axios.put(
    `${BASE_URL}/admin/users/${id}/criminal-record-status`,
    { status: status }
  );
  return response;
};

export const addCriminalCheckNote = async (id: string, note: string) => {
  const response = await axios.post(
    `${BASE_URL}/admin/users/${id}/criminal-record-status/admin-notes`,
    { note: note }
  );
  console.log(response);
  return response;
};

export const updateReportStatus = async (id: string, isSolved: boolean) => {
  const response = await axios.put(`${BASE_URL}/admin/reports/${id}`, {
    isResolved: isSolved,
  });
  return response;
};

export const getChatById = async (id: string) => {
  const response = await axios.get(`${BASE_URL}/admin/chats/${id}`);
  console.log(response);
  return response;
};

export const getAllReports = async () => {
  const response = await axios.get(`${BASE_URL}/admin/reports`);
  console.log(response);
  return response;
};

export const getReportById = async (id: string) => {
  const response = await axios.get(`${BASE_URL}/admin/reports/${id}`);
  console.log(response);
  return response;
};
