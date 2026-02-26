// app/(tabs)/subscription.tsx
import { useRazorpay } from "@/hooks/useRazorpay";
import { loginUser } from "@/services/authService";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { startPayment } = useRazorpay();

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
          text1: "Error",
          text2: "Failed to load subscription amount",
          position: "bottom",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptionAmount();
  }, []);

  // ✅ make sure amount is valid number
  const amountNumber = useMemo(() => {
    const raw = subscriptionAmount;

    if (!raw) return 0;
    if (raw === "undefined" || raw === "null") return 0;

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
          text1: "Error",
          text2: "Student ID not found. Please login again.",
          position: "bottom",
        });
        router.replace("/login");
        return;
      }

      if (!canPay) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Subscription amount not available.",
          position: "bottom",
        });
        return;
      }

      const ok = await startPayment(studentId, (amountNumber), true);

      if (ok) {
        await updateSubscriptionStatus();
      } else {
        Toast.show({
          type: "error",
          text1: "Payment Failed",
          text2: "There was an issue with your payment. Please try again.",
          position: "bottom",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An error occurred during payment. Please try again.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionStatus = async () => {
    try {
      const register_no = await SecureStore.getItemAsync("register_no");

      if (!register_no) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Register number not found. Please login again.",
          position: "bottom",
        });
        router.replace("/login");
        return;
      }

      const res = await loginUser(register_no);

      if (res?.user) {
        await SecureStore.setItemAsync("register_no", String(register_no));
        await SecureStore.setItemAsync("studentId", String(res.user.id));

        if (res.user.subscription) {
          router.replace("/otp");
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Subscription not activated. Please contact support.",
            position: "bottom",
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: res?.message || "Failed to verify subscription status",
          position: "bottom",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          (error)?.response?.data?.message ||
          "Failed to verify subscription status. Please contact support.",
        position: "bottom",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.popup}>
        <Text style={styles.title}>Subscription Required</Text>
        <Text style={styles.subtitle}>
          To continue using this app, you need to activate a yearly subscription.
        </Text>

        <View style={styles.priceBox}>
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={canPay ? styles.priceText : styles.priceTextInactive}>
              ₹{amountNumber} / Year
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
            <Text style={styles.buttonText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={styles.skipText}>Maybe Later</Text>
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
