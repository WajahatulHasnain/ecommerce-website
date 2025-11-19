import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Use relative path for Vite proxy
});

export default api;
