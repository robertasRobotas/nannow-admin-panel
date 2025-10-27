const BASE_URL = "http://localhost:3000";

export const copyReport = (id: string) => {
  navigator.clipboard.writeText(`${BASE_URL}/reports/${id}`);
};

export const copyReview = (id: string) => {
  navigator.clipboard.writeText(`${BASE_URL}/reviews/${id}`);
};
