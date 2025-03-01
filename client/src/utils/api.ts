import axios from "axios";
import { getToken } from "../hooks/auth"; // Import function to get stored token

// Create an Axios instance
const api = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URL}/api`, // Backend URL
});

// Attach token dynamically to every request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Attach token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
