import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";

let BASE_URL = "https://localhost:5000"; // default fallback

export const getBaseUrl = () => BASE_URL;

export const loadBaseUrl = async () => {
  try {
    const saved = await SecureStore.getItemAsync("baseUrl");
    if (saved) {
      BASE_URL = saved;
    } else {
      // Toast.show({
      //   type: "info",
      //   text1: "Info",
      //   text2: "No base URL saved, using default: " + BASE_URL,
      //   position: "bottom",
      // });
    }
  } catch (err) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Failed to load base URL. Please try again.",
      position: "bottom",
    });
  }
  return BASE_URL;
};

export const setBaseUrl = async (url: string) => {
  try {
    BASE_URL = url;
    await SecureStore.setItemAsync("baseUrl", url);
  } catch (err) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Failed to save base URL. Please try again.",
      position: "bottom",
    });
  }
};
