import axios from "axios";
import { getBaseUrl } from "./apiConfig";

// Create an axios instance
const api = axios.create({
  timeout: 10000,
});

// Request helper
export const request = async (endpoint, method = "GET", data = null, headers = {}) => {
  const baseUrl = getBaseUrl().trim();
  const url = `${baseUrl}/${endpoint}`;

  try {
    const res = await api({ url, method, data, headers });
    return res.data;
  } catch (err) {
    if (err.response) {
      // console.error("🔹 Server responded with:", err.response.status, err.response.data);
      // Return structured error instead of throwing
      return {
        success: false,
        status: err.response.status,
        message: err.response.data?.message || "Request failed",
      };
    } else {
      return {
        success: false,
        status: 0,
        message: "Network error or server unreachable",
      };
    }
  }
};




 