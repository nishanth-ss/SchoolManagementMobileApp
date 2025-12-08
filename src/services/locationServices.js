import axios from "axios";

const LOCATION_API = "https://eduhost.onrender.com/api/location";

export const searchLocation = async (query) => {
  try {
    const res = await axios.get(`${LOCATION_API}?search=${query}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};
