import { useRazorpay } from "@/hooks/useRazorpay";
import { useI18n } from "@/i18n/I18nProvider";
import { loginUser } from "@/services/authService";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { startPayment } = useRazorpay();
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [subscriptionAmount, setSubscriptionAmount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubscriptionAmount = async () => {
      try {
        const amount = await SecureStore.getItemAsync("subscriptionAmount");
        setSubscriptionAmount(amount);
      } catch (err) {
        console.error("Error loading subscription amount:", err);
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("failed_load_subscription_amount"),
          position: "bottom",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptionAmount();
  }, [t]);

  const amountNumber = useMemo(() => {
    const raw = subscriptionAmount;
    if (!raw || raw === "undefined" || raw === "null") return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [subscriptionAmount]);

  const canPay = amountNumber > 0;

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      const studentId = await SecureStore.getItemAsync("studentId");
      if (!studentId) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("student_id_not_found_login_again"),
          position: "bottom",
        });
        router.replace("/(auth)/login");
        return;
      }

      if (!canPay) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("subscription_amount_not_available"),
          position: "bottom",
        });
        return;
      }

      const ok = await startPayment(studentId, amountNumber, true);
      if (ok) {
        await updateSubscriptionStatus();
      } else {
        Toast.show({
          type: "error",
          text1: t("payment_failed"),
          text2: t("payment_issue_try_again"),
          position: "bottom",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("payment_error_try_again"),
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionStatus = async () => {
    try {
      const registerNo = await SecureStore.getItemAsync("register_no");

      if (!registerNo) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("register_number_not_found"),
          position: "bottom",
        });
        router.replace("/(auth)/login");
        return;
      }

      const res = await loginUser(registerNo);

      if (res?.user) {
        await SecureStore.setItemAsync("register_no", String(registerNo));
        await SecureStore.setItemAsync("studentId", String(res.user.id));

        if (res.user.subscription) {
          router.replace("/otp");
        } else {
          Toast.show({
            type: "error",
            text1: t("error"),
            text2: t("subscription_not_activated"),
            position: "bottom",
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: res?.message || t("failed_verify_subscription"),
          position: "bottom",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: error?.response?.data?.message || t("failed_verify_support"),
        position: "bottom",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.popup}>
        <Text style={styles.title}>{t("subscription_required")}</Text>
        <Text style={styles.subtitle}>{t("subscription_hint")}</Text>

        <View style={styles.priceBox}>
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={canPay ? styles.priceText : styles.priceTextInactive}>
              ₹{amountNumber} {t("per_year")}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, (loading || !canPay) && styles.buttonDisabled]}
          onPress={handleSubscribe}
          disabled={loading || !canPay}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("subscribe_now")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.skipText}>{t("maybe_later")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#40407a",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  priceBox: {
    backgroundColor: "#e9e8ff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    minWidth: 180,
    alignItems: "center",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#40407a",
  },
  priceTextInactive: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
  },
  button: {
    backgroundColor: "#40407a",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  skipText: {
    color: "#888",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  buttonDisabled: { opacity: 0.6 },
});
