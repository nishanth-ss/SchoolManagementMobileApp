import { loadBaseUrl, setBaseUrl } from "@/api/apiConfig";
import { loginUser, searchLocation } from "@/services/authService";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export default function LoginScreen() {
  const [register_no, setRegisterNo] = useState("");
  const [search, setSearch] = useState("");
  type School = {
    _id: string;
    name: string;
    location: string;
    baseUrl: string;
    amount: number;
    // Add other properties of school object if there are more
  };

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isSchoolSelected, setIsSchoolSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      try {
        const savedUrl = await loadBaseUrl();
        if (savedUrl && savedUrl !== 'https://localhost:5000') {
          // If we have a saved URL, we can pre-select the school
          // You might want to fetch the school details here if needed
        }
      } catch (error) {
        console.log('Failed to load base URL:', error);
      }
    };
    initialize();
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (text) => {
      try {
        const res = await searchLocation(text);
        if (res?.data?.length) {
          setSchools(res.data);
        } else {
          setSchools([]);
        }
      } catch (err) {
        setSchools([]);
      }
    }, 500),
    []
  );

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.length >= 2) {
      debouncedSearch(text);
    } else {
      setSchools([]);
    }
  };

  const handleSelectSchool = async (school: School) => {
    const baseUrl = school.baseUrl.trim();
    try {
      await setBaseUrl(baseUrl);
      await SecureStore.setItemAsync("baseUrl", baseUrl);
      await SecureStore.setItemAsync("subscriptionAmount", String(school.amount));
      setSelectedSchool(school);
      setSearch(school.name);
      setSchools([]);
      setIsSchoolSelected(true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to set school URL. Please try again.",
        position: "bottom",
      });
    }
  };

  const handleLogin = async () => {
    try {
      if (!selectedSchool) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please select a school first",
          position: "bottom",
        });
        return;
      }

      setLoading(true);
      const res = await loginUser(register_no);

      if (res?.user) {
        await SecureStore.setItemAsync("register_no", register_no);
        await SecureStore.setItemAsync("studentId", res.user.id);

        if (res.user.subscription === false) {
          router.replace("/subscription");
        } else {
          router.replace("/otp");
        }
      } else {
        console.log("res",res);
        
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: res?.message || "Invalid credentials or server error",
          position: "bottom",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again later.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Welcome to School Management</Text>

        {!isSchoolSelected ? (
          <>
            <Text style={styles.subtitle}>Select your school to continue</Text>
            <TextInput
              style={styles.input}
              placeholder="Search school name"
              value={search}
              onChangeText={handleSearch}
              autoCapitalize="words"
            />
            {schools.length > 0 ? (
              <FlatList
                style={styles.schoolsList}
                data={schools}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.schoolItem}
                    onPress={() => handleSelectSchool(item)}
                  >
                    <Text style={styles.schoolName}>{item.name}</Text>
                    <Text style={styles.schoolLocation}>{item.location}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : search.length >= 2 ? (
              <Text style={styles.noResults}>No schools found</Text>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.selectedSchoolContainer}>
              <Text style={styles.selectedSchoolLabel}>Selected School:</Text>
              <Text style={styles.selectedSchoolName}>{selectedSchool?.name}</Text>
              <Text style={styles.selectedSchoolLocation}>{selectedSchool?.location}</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSchoolSelected(false);
                  setSearch('');
                }}
                style={styles.changeSchoolButton}
              >
                <Text style={styles.changeSchoolText}>Change School</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Enter student registered roll number"
              value={register_no}
              onChangeText={setRegisterNo}
              autoCapitalize="none"
              keyboardType="default"
            />

            <TouchableOpacity
              style={[styles.button, (!register_no || loading) && styles.disabledButton]}
              onPress={handleLogin}
              disabled={!register_no || loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Loading..." : "Login"}
              </Text>
            </TouchableOpacity>

            {/* <View style={{ marginTop: 20, height: 250 }}>
              <Text style={styles.faceIdInfo}>If you already have a face ID, please login using it</Text>
              <TouchableOpacity
                style={styles.faceIdButton}
                onPress={() => router.push("/faceCapture")}
              >
                <ScanFace size={24} color="#40407a" />
                <Text style={styles.faceIdText}>Face ID to login</Text>
              </TouchableOpacity>
            </View> */}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#40407a"
  },
  innerContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#000"
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    width: "100%",
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    fontSize: 16,
  },
  schoolsList: {
    width: '100%',
    maxHeight: 200,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  schoolItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  schoolLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectedSchoolContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedSchoolLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  selectedSchoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedSchoolLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  changeSchoolButton: {
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#e9ecef',
    alignSelf: 'flex-start',
  },
  changeSchoolText: {
    color: '#40407a',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    width: "100%",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#40407a",
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center"
  },
  disabledButton: {
    opacity: 0.6,
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
    padding: 15,
  },
  faceIdButton: {
    marginTop: 5,
    padding: 15,
    backgroundColor: 'rgba(64, 64, 122, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    borderColor: '#40407a',
    borderWidth: 1,
    marginBottom: 10,
  },
  faceIdText: {
    fontSize: 16,
    color: '#40407a',
  },
  faceIdInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
});