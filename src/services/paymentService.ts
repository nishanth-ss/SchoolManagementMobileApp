// src/services/paymentService.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { getBaseUrl } from "../api/apiConfig";

// Create Axios instance with dynamic baseURL
const API = axios.create({
  baseURL: getBaseUrl(), // ← Use the correct one
});

// Optional: Update baseURL when it changes (advanced)
export const updateAxiosBaseURL = () => {
  API.defaults.baseURL = getBaseUrl();
};

// Add auth token
API.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createOrder = async (studentId: string, amount: number, subscription: boolean = false) => {
  if(!getBaseUrl().includes("localhost")){
    updateAxiosBaseURL();
  }
  
  try {
    const endpoint = subscription ? "/payment/create" : "/payment/parent/create";
    const url = API.defaults.baseURL + endpoint;
    
    const { data } = await API.post(endpoint, { 
      studentId, 
      amount,
      // Add any additional required fields here
    });
    
    return data;
  } catch (e: any) {
    const errorMessage = e.response?.data?.message || "Failed to create order";
    Toast.show({ 
      type: "error", 
      text1: "Error", 
      text2: errorMessage 
    });
    throw e;
  }
};

export const verifyPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  subscription: boolean;
}) => {
  try {
    const url = payload.subscription ? "/payment/verify" : "/payment/parent/verify";
    const {data} = await API.post(url, {...payload,studentId: await SecureStore.getItemAsync("studentId")});
    return data;
  } catch (e: any) {
    Toast.show({ type: "error", text1: "Error", text2: "Payment verification failed" });
    throw e;
  }
};