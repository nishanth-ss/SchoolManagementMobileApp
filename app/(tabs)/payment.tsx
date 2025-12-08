import { useRazorpay } from '@/hooks/useRazorpay';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function PaymentScreen() {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Replace with actual student ID from your state/context
  
  const { startPayment } = useRazorpay();
  
  const handlePayment = async () => {
    const studentId = await SecureStore.getItemAsync("studentId");
    if (!studentId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Student ID not found. Please log in again.',
        position: 'bottom',
      });
      return;
    }
    
    const paymentAmount = Number(amount);
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid amount',
        position: 'bottom',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Set the third parameter to true if this is a subscription payment
      const isSubscription = false; // Change this based on your payment type
      const ok = await startPayment(studentId, paymentAmount, isSubscription);
      
      if (ok) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Payment initiated successfully',
          position: 'bottom',
        });
        setAmount('');
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to process payment. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'bottom',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.message}>
          The amount will be added to your student's account
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter Amount (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Send Payment'}
          </Text>
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
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#40407a',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a5a5c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});