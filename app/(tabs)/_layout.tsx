// app/(tabs)/_layout.tsx
import { Tabs, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { CreditCard, History, LogOut, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);

useEffect(() => {
  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const regNo = await SecureStore.getItemAsync("register_no");

      if (!token || !regNo) {
        router.replace({ pathname: "/login" });
        return;
      }

    } catch (error) {
      router.replace({ pathname: "/login" });
    } finally {
      setLoading(false);
    }
  };

  checkAuth();
}, []);

const handleLogout = async () => {
  await SecureStore.deleteItemAsync("authToken");
  await SecureStore.deleteItemAsync("register_no");
  await SecureStore.deleteItemAsync("studentId");
  await SecureStore.deleteItemAsync("subscription");
  await SecureStore.deleteItemAsync("baseUrl");
  router.replace({ pathname: "/login" });
};



  if (loading) {
    return <ActivityIndicator size="large" color="#40407a" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.4)",
        tabBarStyle: {
          backgroundColor: "#40407a",
          borderTopWidth: 0.5,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 5,
          borderTopColor: "rgba(255,255,255,0.2)",
        },
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          headerStyle: { backgroundColor: "#40407a" },
          headerTitleStyle: { color: "#fff" },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                handleLogout();
              }}
              style={{ marginRight: 15 }}
            >
              <LogOut color="#fff" size={22} />
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="transaction"
        options={{
          title: "Transaction",
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
          headerStyle: { backgroundColor: "#40407a" },
          headerTitleStyle: { color: "#fff" },
        }}
      />

      <Tabs.Screen
        name="payment"
        options={{
          title: "Payment",
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
          headerStyle: { backgroundColor: "#40407a" },
          headerTitleStyle: { color: "#fff" },
        }}
      />
    </Tabs>
  );
}
