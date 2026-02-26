import { loadBaseUrl, setBaseUrl } from "@/api/apiConfig";
import LanguagePicker from "@/components/LanguagePicker";
import { useI18n } from "@/i18n/I18nProvider";
import { loginUser, searchLocation } from "@/services/authService";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

type School = {
  _id: string;
  name: string;
  location: string;
  baseUrl: string;
  amount: number;
};

function debounce<F extends (...args: any[]) => any>(func: F, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const [register_no, setRegisterNo] = useState("");
  const [search, setSearch] = useState("");

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isSchoolSelected, setIsSchoolSelected] = useState(false);

  const [loading, setLoading] = useState(false);

  // prevent setting state after unmount during debounce
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const savedUrl = await loadBaseUrl();
        // optional: you can restore previously selected school based on savedUrl
        console.log("Saved baseUrl:", savedUrl);
      } catch (error) {
        console.log("Failed to load base URL:", error);
      }
    };
    initialize();
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      try {
        const res = await searchLocation(text);

        const list = res?.data ?? res ?? [];
        if (mountedRef.current) {
          if (Array.isArray(list) && list.length) setSchools(list);
          else setSchools([]);
        }
      } catch (err) {
        if (mountedRef.current) setSchools([]);
      }
    }, 500),
    []
  );

  const handleSearch = (text: string) => {
    setSearch(text);

    if (text.trim().length >= 2) {
      debouncedSearch(text.trim());
    } else {
      setSchools([]);
    }
  };

  const handleSelectSchool = async (school: School) => {
    const baseUrl = (school.baseUrl || "").trim();

    if (!baseUrl) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("school_url_missing"),
        position: "bottom",
      });
      return;
    }

    try {
      await setBaseUrl(baseUrl);
      await SecureStore.setItemAsync("baseUrl", baseUrl);

      // ✅ safe store amount
      const amt = Number(school.amount);
      await SecureStore.setItemAsync(
        "subscriptionAmount",
        String(Number.isFinite(amt) ? amt : 0)
      );

      setSelectedSchool(school);
      setSearch(school.name);
      setSchools([]);
      setIsSchoolSelected(true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("failed_set_school_url"),
        position: "bottom",
      });
    }
  };

  const handleLogin = async () => {
    const reg = register_no.trim();

    try {
      if (!selectedSchool) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("select_school_first"),
          position: "bottom",
        });
        return;
      }

      if (!reg) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("enter_registration_number"),
          position: "bottom",
        });
        return;
      }

      setLoading(true);

      const res = await loginUser(reg);
      console.log("LOGIN RESPONSE:", JSON.stringify(res, null, 2));

      const user = res?.user;
      if (!user) {
        Toast.show({
          type: "error",
          text1: t("login_failed"),
          text2: res?.message || t("invalid_credentials"),
          position: "bottom",
        });
        return;
      }

      // ✅ backend may return id or _id
      const studentId = user?.id ?? user?._id;
      if (!studentId) {
        Toast.show({
          type: "error",
          text1: t("login_failed"),
          text2: t("student_id_missing"),
          position: "bottom",
        });
        return;
      }

      await SecureStore.setItemAsync("register_no", String(reg));
      await SecureStore.setItemAsync("studentId", String(studentId));

      // ✅ subscription could be boolean or 0/1 or string
      const subscribed =
        user?.subscription === true ||
        user?.subscription === 1 ||
        user?.subscription === "true";

      if (!subscribed) {
        router.replace("/subscription");
      } else {
        router.replace("/otp");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          error?.response?.data?.message ||
          error?.message ||
          t("something_wrong_try_later"),
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
        <LanguagePicker />
        <Text style={styles.title}>{t("welcome_school")}</Text>

        {!isSchoolSelected ? (
          <>
            <Text style={styles.subtitle}>{t("select_school_continue")}</Text>

            <TextInput
              style={styles.input}
              placeholder={t("search_school_name")}
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
            ) : search.trim().length >= 2 ? (
              <Text style={styles.noResults}>{t("no_schools_found")}</Text>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.selectedSchoolContainer}>
              <Text style={styles.selectedSchoolLabel}>{t("selected_school")}</Text>
              <Text style={styles.selectedSchoolName}>{selectedSchool?.name}</Text>
              <Text style={styles.selectedSchoolLocation}>
                {selectedSchool?.location}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setIsSchoolSelected(false);
                  setSelectedSchool(null);
                  setSearch("");
                  setSchools([]);
                }}
                style={styles.changeSchoolButton}
              >
                <Text style={styles.changeSchoolText}>{t("change_school")}</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder={t("enter_roll_number")}
              value={register_no}
              onChangeText={setRegisterNo}
              autoCapitalize="none"
              keyboardType="default"
            />

            <TouchableOpacity
              style={[styles.button, (!register_no.trim() || loading) && styles.disabledButton]}
              onPress={handleLogin}
              disabled={!register_no.trim() || loading}
            >
              <Text style={styles.buttonText}>
                {loading ? t("loading") : t("login")}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: "#40407a",
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
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    width: "100%",
    backgroundColor: "#fff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    fontSize: 16,
  },
  schoolsList: {
    width: "100%",
    maxHeight: 200,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  schoolItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  schoolName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  schoolLocation: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  selectedSchoolContainer: {
    width: "100%",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedSchoolLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  selectedSchoolName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectedSchoolLocation: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  changeSchoolButton: {
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#e9ecef",
    alignSelf: "flex-start",
  },
  changeSchoolText: {
    color: "#40407a",
    fontSize: 14,
    fontWeight: "500",
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
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  noResults: {
    textAlign: "center",
    color: "#999",
    marginTop: 10,
    fontStyle: "italic",
    padding: 15,
  },
});
