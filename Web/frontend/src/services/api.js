import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
});

export const fetchDashboardSummary = async () => {
  return Promise.resolve({
    message: "Connected to ArenIQ dashboard service.",
  });
};

export default api;
