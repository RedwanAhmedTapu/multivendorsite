"use client";

// next-intl provider for the Marketing Center admin screens (and the
// marketingManagement checkbox). Client-side and scoped: it does not change
// the app-wide Next.js config or root layout. Locale = "en" | "bn",
// remembered per browser; time zone fixed to Asia/Dhaka so dates render the
// same on every machine.

import * as React from "react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import bn from "@/messages/bn.json";

export type AppLocale = "en" | "bn";
export const LOCALES: AppLocale[] = ["en", "bn"];
const STORAGE_KEY = "finix.locale";
const MESSAGES = { en, bn } as const;

const LocaleContext = React.createContext<{ locale: AppLocale; setLocale: (l: AppLocale) => void; active: boolean }>({
  locale: "en",
  setLocale: () => {},
  active: false,
});

export function useAppLocale() {
  return React.useContext(LocaleContext);
}

/** Reuses an enclosing provider (one language state per screen); otherwise creates one. */
export function MarketingIntlProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: AppLocale }) {
  const parent = React.useContext(LocaleContext);
  if (parent.active) return <>{children}</>;
  return <RootProvider initialLocale={initialLocale}>{children}</RootProvider>;
}

function RootProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: AppLocale }) {
  const [locale, setLocaleState] = React.useState<AppLocale>(initialLocale ?? "en");

  // Restore the saved choice after mount (server render is always "en").
  React.useEffect(() => {
    if (initialLocale) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "bn") setLocaleState(saved);
    } catch {
      /* storage blocked — keep the default */
    }
  }, [initialLocale]);

  const setLocale = React.useCallback((l: AppLocale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage blocked — the choice lasts until reload */
    }
  }, []);

  const ctx = React.useMemo(() => ({ locale, setLocale, active: true }), [locale, setLocale]);
  return (
    <LocaleContext.Provider value={ctx}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Asia/Dhaka">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
