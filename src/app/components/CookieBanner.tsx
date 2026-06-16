"use client";

import { useCookieConsent } from "@/app/contexts/CookieConsentContext";
import { useI18n } from "@/app/contexts/I18nContext";
import { UIButton } from "@/app/components/ui/button";

const CookieBanner = () => {
  const { consent, isLoaded, acceptCookies, rejectCookies } =
    useCookieConsent();
  const { t } = useI18n();

  if (!isLoaded || consent !== null) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[1100] md:left-1/2 md:right-auto md:w-[760px] md:-translate-x-1/2">
      <div
        className="rounded-xl border p-4 shadow-2xl md:p-5"
        style={{
          backgroundColor: "var(--color-primary)",
          color: "var(--color-text-light)",
          borderColor: "rgba(var(--color-primary-rgb), 0.6)",
        }}
      >
        <p className="text-sm leading-relaxed md:text-base">
          {t("cookies.message")}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <UIButton
            onClick={rejectCookies}
            variant="secondary"
            style={{
              color: "var(--color-text-light)",
              borderColor: "rgba(var(--color-accent-rgb), 0.6)",
              backgroundColor: "transparent",
            }}
          >
            {t("cookies.reject")}
          </UIButton>
          <UIButton onClick={acceptCookies}>
            {t("cookies.accept")}
          </UIButton>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;