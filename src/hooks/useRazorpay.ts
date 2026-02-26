// src/hooks/useRazorpay.ts
import { useI18n } from "@/i18n/I18nProvider";
import RazorpayCheckout from "react-native-razorpay"; // Correct import
import Toast from "react-native-toast-message";
import { createOrder, verifyPayment } from "../services/paymentService";

export const useRazorpay = () => {
  const { t } = useI18n();
  const startPayment = async (studentId: string, amount: number, subscription?: boolean) => {
    try {
      // 1. First verify Razorpay is available
      if (!RazorpayCheckout) {
        throw new Error('Razorpay SDK not initialized');
      }

      // 2. Create order
      const { order } = await createOrder(studentId, amount, subscription);

      const options = {
        key: "rzp_live_Rt5vLcnxGaTs8Y",
        amount: order.amount,
        currency: order.currency ?? "INR",
        name: "Student Wallet",
        order_id: order.id,
        description: subscription ? "Yearly subscription" : "Payment",
        theme: { color: "#40407a" },
        modal: { 
          ondismiss: () => {
            Toast.show({
              type: 'info',
              text1: t("payment_cancelled"),
              text2: t("payment_was_cancelled"),
              position: 'bottom',
            });
          } 
        },
      };


      try {
        // 3. Open Razorpay checkout
        const data = await RazorpayCheckout.open(options);

        // 4. Verify payment on your server
        await verifyPayment({
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
          subscription: subscription ?? false,
        });

        Toast.show({ 
          type: "success", 
          text1: t("success"), 
          text2: subscription ? t("subscription_successful") : t("payment_successful")
        });
        return true;
      } catch (error: any) {
        // Handle different error cases
        if (error.code === 0 || error.code === "0") {
          // User closed the payment form
          return false;
        }
        
        const errorMessage = error.description || 
                           error.error?.description || 
                           t("payment_failed_try_again");
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      
      // Show error toast
      Toast.show({
        type: "error",
        text1: t("payment_failed"),
        text2: error.message || t("payment_error_try_again"),
        position: 'bottom',
        visibilityTime: 4000,
      });
      
      return false;
    }
  };

  return { startPayment };
};
