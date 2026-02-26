// Add this at the top of your file, after the imports
import { LogBox } from 'react-native';

// Add this right after your imports
LogBox.ignoreLogs(['Unsupported top level event type "topSvgLayout"']);

// The rest of your imports...
import { Stack, useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { I18nProvider, useI18n } from "@/i18n/I18nProvider";

// Rest of your file remains the same...

// Error boundary fallback component
function ErrorFallback({ error }: { error: Error }) {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10, fontWeight: 'bold' }}>{t("app_error_title")}</Text>
      <Text style={{ color: 'red', marginBottom: 10 }}>{error.message}</Text>
      <Text>{t("app_error_hint")}</Text>
    </View>
  );
}

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  // Check auth status when the component mounts and navigation is ready
  // In _layout.tsx, update the useEffect hook like this:
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [token, registerNo] = await Promise.all([
          SecureStore.getItemAsync("authToken"),
          SecureStore.getItemAsync("register_no")
        ]);

        if (token && registerNo) {
          router.replace("/(tabs)/profile");
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace("/(auth)/login");
      } finally {
        setIsLoading(false);
      }
    };

    // Remove the outer setTimeout and call checkAuth directly
    checkAuth();
  }, []);

  // if (isLoading) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <ActivityIndicator size="large" color="#40407a" />
  //     </View>
  //   );
  // }

  return (
    <I18nProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="otp" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="subscription" />
            <Stack.Screen name="faceCapture" />
          </Stack>
          <Toast />
        </SafeAreaProvider>
      </ErrorBoundary>
    </I18nProvider>
  );
}
