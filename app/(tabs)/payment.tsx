import { useI18n } from "@/i18n/I18nProvider";
import { useRazorpay } from "@/hooks/useRazorpay";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function PaymentScreen() {
  const { t } = useI18n();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { startPayment } = useRazorpay();

  const handlePayment = async () => {
    const studentId = await SecureStore.getItemAsync("studentId");
    if (!studentId) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("student_id_not_found_login_again"),
        position: "bottom",
      });
      return;
    }

    const paymentAmount = Number(amount);
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("valid_amount_error"),
        position: "bottom",
      });
      return;
    }

    setIsLoading(true);
    try {
      const isSubscription = false;
      const ok = await startPayment(studentId, paymentAmount, isSubscription);

      if (ok) {
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("payment_initiated_success"),
          position: "bottom",
        });
        setAmount("");
      } else {
        throw new Error("Payment initialization failed");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || t("failed_process_payment");
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: errorMessage,
        position: "bottom",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.message}>{t("amount_added_hint")}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t("enter_amount")}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder={t("enter_amount_placeholder")}
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? t("processing") : t("send_payment")}</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  message: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#40407a",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#a5a5c7",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
