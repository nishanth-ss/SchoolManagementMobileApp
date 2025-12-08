import { getStudentProfile } from "@/services/studentProfile";
import { BASE_URL } from "@/utils/config";
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const regNo = await SecureStore.getItemAsync("register_no");
      if (!regNo) {
        setLoading(false);
        return;
      }
      const res = await getStudentProfile(regNo);
      if (res?.data) {
        setData(res.data);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch profile data. Please try again.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  const getStudentProfileData = async () => {
    try {
      const regNo = await SecureStore.getItemAsync("register_no");
      if (!regNo) {
        setLoading(false);
        return;
      }

      const res = await getStudentProfile(regNo || "");
      
      // ✅ Guard for empty or undefined response
      if (res && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (error) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStudentProfileData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#40407a" />
        <Text>Loading student data...</Text>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "red" }}>No data found</Text>
      </SafeAreaView>
    );
  }

  // ✅ Show profile picture (if exists)
  const profileImage =
    data.pro_pic?.file_url
      ? {
        uri: data.pro_pic.file_url.startsWith("http")
          ? data.pro_pic.file_url
          : `${BASE_URL}${data.pro_pic.file_url.replace(/\\/g, "/")}`,
      }
      : require("../../assets/images/react-logo.png");

  return (
<SafeAreaView style={[styles.container, { flex: 1 }]} edges={[]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* 🖼 Profile header with image */}
          <View style={styles.profileHeader}>
            <Image source={profileImage} style={styles.profileImage} />
            <View>
              <Text style={styles.name}>{data.student_name}</Text>
              <Text style={styles.regNo}>Reg No: {data.registration_number}</Text>
              <Text style={styles.depositeAmount}>Balance: ₹{data.deposite_amount}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.subtitle}>Personal Details</Text>
          <Text>Gender: {data.gender}</Text>
          <Text>Father: {data.father_name}</Text>
          <Text>Mother: {data.mother_name}</Text>
          <Text>Date of Birth: {new Date(data.date_of_birth).toLocaleDateString()}</Text>
          <Text>Birth Place: {data.birth_place}</Text>
          <Text>Blood Group: {data.blood_group}</Text>
          <Text>Contact: {data.contact_number}</Text>
          <Text>Nationality: {data.nationality}</Text>
          <Text>Religion: {data.religion}</Text>
          <Text>Mother Tongue: {data.mother_tongue}</Text>

          <View style={styles.subCard}>
            <Text style={styles.subtitle}>Class Info</Text>
            <Text>Class: {data.class_info?.class_name}</Text>
            <Text>Section: {data.class_info?.section}</Text>
            <Text>Academic Year: {data.class_info?.academic_year}</Text>
          </View>

          {/* <View style={styles.subCard}>
            <Text style={styles.subtitle}>Location</Text>
            <Text>Location Name: {data.location_id?.locationName}</Text>
          </View> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 10,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 15,
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  regNo: {
    color: "#333",
    marginTop: 4,
  },
  depositeAmount: {
    color: "#008000",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: "#40407a",
  },
  subCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
