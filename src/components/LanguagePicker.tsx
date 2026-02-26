import { useI18n } from "@/i18n/I18nProvider";
import { LanguageCode } from "@/i18n/translations";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type LanguagePickerProps = {
  compact?: boolean;
};

export default function LanguagePicker({ compact = false }: LanguagePickerProps) {
  const { language, languageOptions, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);

  const onSelectLanguage = async (code: LanguageCode) => {
    await setLanguage(code);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, compact && styles.buttonCompact]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.buttonText, compact && styles.buttonTextCompact]}>
          {t("language")}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modal}>
            <Text style={styles.title}>{t("choose_language")}</Text>
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {languageOptions.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.item, language === item.code && styles.selectedItem]}
                  onPress={() => onSelectLanguage(item.code)}
                >
                  <Text style={[styles.itemText, language === item.code && styles.selectedItemText]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setOpen(false)}>
                <Text style={styles.closeButtonText}>{t("close")}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#f0f1ff",
    borderColor: "#40407a",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-end",
  },
  buttonCompact: {
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  buttonText: {
    color: "#40407a",
    fontWeight: "600",
  },
  buttonTextCompact: {
    color: "#fff",
    fontSize: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#222",
  },
  list: {
    maxHeight: 420,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: "#eef0ff",
  },
  itemText: {
    color: "#111",
    fontSize: 15,
  },
  selectedItemText: {
    color: "#40407a",
    fontWeight: "700",
  },
  footer: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#40407a",
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
