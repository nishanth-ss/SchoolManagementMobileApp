import { useI18n } from "@/i18n/I18nProvider";
import { loginWithOtp } from "@/services/authService";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function OtpScreen() {
  const { t } = useI18n();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputs = useRef<TextInput[]>([]);
  const [registerNo, setRegisterNo] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadRegisterNo = async () => {
      const regNo = await SecureStore.getItemAsync("register_no");
      setRegisterNo(regNo);
    };
    loadRegisterNo();
  }, []);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("");
    const res = await loginWithOtp(registerNo || "", enteredOtp);

    if (res?.user) {
      await SecureStore.setItemAsync("authToken", res.token);
      await SecureStore.setItemAsync("register_no", registerNo || "");
      await SecureStore.setItemAsync("studentId", res?.user?.id);
      await SecureStore.setItemAsync("subscription", res.user.subscription ? "true" : "false");

      if (res.user.subscription) {
        router.replace("/(tabs)/profile");
      } else {
        router.replace("/subscription");
      }
      return;
    }

    Toast.show({
      type: "error",
      text1: t("login_failed"),
      text2: res?.message || t("something_wrong_try_later"),
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.innerContainer}>
        <Text style={styles.title}>{t("enter_otp")}</Text>
        <Text style={styles.subtitle}>{t("otp_sent_hint")}</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputs.current[index] = ref;
              }}
              style={styles.otpInput}
              value={digit}
              onChangeText={(text) => handleChange(text.replace(/[^0-9]/g, ""), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
          <Text style={styles.buttonText}>{t("verify_otp")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnlogin} onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.buttonTextLogin}>{t("back_to_login")}</Text>
        </TouchableOpacity>
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
    marginBottom: 40,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    width: 60,
    height: 55,
    textAlign: "center",
    fontSize: 22,
    marginRight: 10,
  },
  button: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#40407a",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  btnlogin: {
    marginTop: 20,
    color: "#40407a",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderColor: "#40407a",
    borderWidth: 1,
    width: "100%",
    padding: 10,
  },
  buttonTextLogin: {
    color: "#40407a",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
