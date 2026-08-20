"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CookieConsentStatus = "accepted" | "rejected" | null;

interface CookieConsentContextType {
  consent: CookieConsentStatus;
  isLoaded: boolean;
  acceptCookies: () => void;
  rejectCookies: () => void;
}

const STORAGE_KEY = "aclimate_cookie_consent";
const COOKIE_NAME = "aclimate_cookie_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const CookieConsentContext = createContext<
  CookieConsentContextType | undefined
>(undefined);

const persistConsent = (value: Exclude<CookieConsentStatus, null>) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, value);
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
};

interface CookieConsentProviderProps {
  children: React.ReactNode;
}

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({
  children,
}) => {
  const [consent, setConsent] = useState<CookieConsentStatus>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedConsent = window.localStorage.getItem(STORAGE_KEY);
    if (storedConsent === "accepted" || storedConsent === "rejected") {
      setConsent(storedConsent);
    }

    setIsLoaded(true);
  }, []);

  const acceptCookies = useCallback(() => {
    setConsent("accepted");
    persistConsent("accepted");
  }, []);

  const rejectCookies = useCallback(() => {
    setConsent("rejected");
    persistConsent("rejected");
  }, []);

  const contextValue = useMemo<CookieConsentContextType>(
    () => ({
      consent,
      isLoaded,
      acceptCookies,
      rejectCookies,
    }),
    [consent, isLoaded, acceptCookies, rejectCookies],
  );

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error(
      "useCookieConsent must be used within a CookieConsentProvider",
    );
  }

  return context;
};
