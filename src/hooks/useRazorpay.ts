// src/hooks/useRazorpay.ts
import RazorpayCheckout from "react-native-razorpay"; // Correct import
import Toast from "react-native-toast-message";
import { createOrder, verifyPayment } from "../services/paymentService";

export const useRazorpay = () => {
  const startPayment = async (studentId: string, amount: number, subscription?: boolean) => {
    try {
      // 1. First verify Razorpay is available
      if (!RazorpayCheckout) {
        throw new Error('Razorpay SDK not initialized');
      }

      // 2. Create order
      const { order } = await createOrder(studentId, amount, subscription);

      const options = {
        key: "rzp_test_qXH0h7SCch7OVM",
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
              text1: 'Payment Cancelled',
              text2: 'Payment was cancelled',
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
          text1: "Success", 
          text2: subscription ? "Subscription successful!" : "Payment successful!" 
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
                           "Payment failed. Please try again.";
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      
      // Show error toast
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: error.message || "An error occurred during payment. Please try again.",
        position: 'bottom',
        visibilityTime: 4000,
      });
      
      return false;
    }
  };

  return { startPayment };
};