// app/(tabs)/subscription.tsx  (or wherever you keep it)
import { useRazorpay } from "@/hooks/useRazorpay";
import { loginUser } from "@/services/authService";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { startPayment } = useRazorpay();
  const [loading, setLoading] = useState(false);
  const [subscriptionAmount, setSubscriptionAmount] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubscriptionAmount = async () => {
      try {
        const amount = await SecureStore.getItemAsync("subscriptionAmount");
        setSubscriptionAmount(amount);
      } catch (err) {
        console.error('Error loading subscription amount:', err);
        setError('Failed to load subscription amount');
      } finally {
        setIsLoading(false);
      }
    };
    loadSubscriptionAmount();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const studentId = await SecureStore.getItem("studentId");
      const amount = subscriptionAmount;

      const ok = await startPayment(studentId, amount, true);
      setLoading(false);

      if (ok) {
        // Payment was successful, update user's subscription status
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
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An error occurred during payment. Please try again.",
        position: "bottom",
      });
    }
  };

  const updateSubscriptionStatus = async () => {
    try {
      const register_no = await SecureStore.getItem("register_no");
      const res = await loginUser(register_no);

      if (res?.user) {
        await SecureStore.setItem("register_no", register_no);
        await SecureStore.setItem("studentId", res.user.id);

        if (res.user.subscription) {
          // If subscription is now true, go to OTP
          router.replace("/otp");
        } else {
          // This shouldn't happen if payment was successful
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Subscription not activated. Please contact support.",
            position: "bottom",
          });
        }
      } else {
        throw new Error("Failed to verify subscription status");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to verify subscription status. Please check your account or contact support.",
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
          <Text style={subscriptionAmount ? styles.priceText : priceTextInactive}>₹{subscriptionAmount || 0} / Year</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubscribe}
          disabled={loading || !subscriptionAmount}
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
  },
  priceText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#40407a",
  },
   priceTextInactive: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  button: {
    backgroundColor: "#40407a",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 10,
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