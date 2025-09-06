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

export const getChatById = async (id: string) => {
  const response = await axios.get(`${BASE_URL}/admin/chats/${id}`);
  console.log(response);
  return response;
};
