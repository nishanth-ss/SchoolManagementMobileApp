import { useI18n } from "@/i18n/I18nProvider";
import { getStudentTransactions } from "@/services/studentProfile";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function TransactionsScreen() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });

  const fetchTransactions = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        const regNo = await SecureStore.getItemAsync("register_no");
        if (!regNo) {
          setLoading(false);
          return;
        }
        const res = await getStudentTransactions(regNo, page, pagination.pageSize);
        setData(res.transactions || []);
        setPagination((prev) => ({
          ...prev,
          page,
          totalPages: res.totalPages || Math.ceil((res.totalItems || 0) / pagination.pageSize) || 1,
        }));
      } catch (err) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("failed_fetch_transactions"),
          position: "bottom",
        });
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize, t]
  );

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(1);
    }, [fetchTransactions])
  );

  useEffect(() => {
    fetchTransactions(pagination.page);
  }, [pagination.page, fetchTransactions]);

  const renderItem = ({ item }: any) => {
    const date = item.createdAtFormatted || new Date(item.createdAt).toLocaleString();
    const amount = item.totalAmount || item.depositAmount || 0;
    const source = item.source || t("na");
    const statusRaw = String(item.status || (item.is_reversed ? "Reversed" : "Completed"));
    const isCompleted = statusRaw.toLowerCase() === "completed";
    const status = isCompleted ? t("completed") : t("reversed");
    const hasProducts = item.products && item.products.length > 0;

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t("date")}:</Text>
          <Text style={styles.value}>{date}</Text>
        </View>

        {hasProducts ? (
          <View style={styles.productsContainer}>
            <Text style={[styles.label, { marginBottom: 5 }]}>{t("products")}:</Text>
            {item.products.map((product: any, index: number) => {
              const productName = product.productId?.itemName || product.itemName || t("product");
              const productPrice = product.productId?.price || product.price || 0;
              const quantity = product.quantity || 1;

              return (
                <View key={index} style={styles.productItem}>
                  <Text style={styles.productName}>
                    {productName}
                    <Text style={styles.productQuantity}> x {quantity}</Text>
                  </Text>
                  <Text style={styles.productPrice}>₹{(productPrice * quantity).toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.label}>{t("total_amount")}:</Text>
          <Text style={[styles.value, styles.totalAmount]}>₹{amount.toFixed(2)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t("source")}:</Text>
          <Text style={styles.value}>{source}</Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.status, isCompleted ? styles.paid : styles.pending]}>
            {status}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { flex: 1 }]} edges={[]}>
        <ActivityIndicator size="large" color="#40407a" />
        <Text>{t("loading_transactions")}</Text>
      </SafeAreaView>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "red" }}>{t("no_transactions_found")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]} edges={[]}>
      <FlatList
        data={data}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
      />

      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={() =>
            setPagination((prev) => ({
              ...prev,
              page: Math.max(prev.page - 1, 1),
            }))
          }
          disabled={pagination.page === 1}
          style={[styles.pageButton, pagination.page === 1 && styles.disabledButton]}
        >
          <Text style={styles.pageText}>{t("prev")}</Text>
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          {t("page_of", { page: pagination.page, totalPages: pagination.totalPages })}
        </Text>

        <TouchableOpacity
          onPress={() =>
            setPagination((prev) => ({
              ...prev,
              page: Math.min(prev.page + 1, prev.totalPages),
            }))
          }
          disabled={pagination.page === pagination.totalPages}
          style={[styles.pageButton, pagination.page === pagination.totalPages && styles.disabledButton]}
        >
          <Text style={styles.pageText}>{t("next")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#f8f9ff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#40407a",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productsContainer: {
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  productName: {
    flex: 1,
    color: "#333",
    fontWeight: "500",
  },
  productQuantity: {
    color: "#666",
    fontSize: 13,
  },
  productPrice: {
    color: "#2196F3",
    fontWeight: "600",
  },
  totalAmount: {
    color: "#2196F3",
    fontWeight: "bold",
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    color: "#555",
    fontWeight: "500",
  },
  value: {
    color: "#111",
  },
  status: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontWeight: "600",
  },
  paid: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  pending: {
    backgroundColor: "#fff3cd",
    color: "#856404",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageButton: {
    backgroundColor: "#40407a",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  pageText: {
    color: "#fff",
    fontWeight: "600",
  },
  pageIndicator: {
    color: "#40407a",
    fontWeight: "600",
  },
});
