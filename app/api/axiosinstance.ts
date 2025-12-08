// app/api/axiosInstance.ts
import { BASE_URL } from "@/utils/config";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Conditionally add token, skip for public endpoints
api.interceptors.request.use(async (config: any) => {
  const noAuthRequired = [
    "/user/login", 
  ];

  // Check if current request matches any no-auth endpoint
  const isPublic = noAuthRequired.some((url) =>
    config.url?.includes(url)
  );

  if (!isPublic) {
    const token = await SecureStore.getItemAsync("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;
