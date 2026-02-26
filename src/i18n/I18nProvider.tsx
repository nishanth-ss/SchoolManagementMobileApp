import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGE_OPTIONS, LanguageCode, TranslationKey, translations } from "./translations";

type Params = Record<string, string | number>;

type I18nContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: TranslationKey, params?: Params) => string;
  languageOptions: { code: LanguageCode; label: string }[];
};

const STORAGE_KEY = "app_language";

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, params?: Params) {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}`, "g"), String(v)),
    template
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved && LANGUAGE_OPTIONS.some((item) => item.code === saved)) {
          setLanguageState(saved as LanguageCode);
        }
      } catch (error) {
        console.warn("Failed to load language:", error);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = async (next: LanguageCode) => {
    setLanguageState(next);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, next);
    } catch (error) {
      console.warn("Failed to save language:", error);
    }
  };

  const t = (key: TranslationKey, params?: Params) => {
    const text = translations[language][key] ?? translations.en[key] ?? key;
    return interpolate(text, params);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languageOptions: LANGUAGE_OPTIONS,
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
