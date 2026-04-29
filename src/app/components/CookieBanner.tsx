"use client";

import { useCookieConsent } from "@/app/contexts/CookieConsentContext";
import { useI18n } from "@/app/contexts/I18nContext";

const CookieBanner = () => {
  const { consent, isLoaded, acceptCookies, rejectCookies } =
    useCookieConsent();
  const { t } = useI18n();

  if (!isLoaded || consent !== null) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[1100] md:left-1/2 md:right-auto md:w-[760px] md:-translate-x-1/2">
      <div className="rounded-xl border border-[#bc6c25]/60 bg-[#283618] p-4 shadow-2xl md:p-5">
        <p className="text-sm leading-relaxed text-amber-50 md:text-base">
          {t("cookies.message")}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={rejectCookies}
            className="rounded-lg border border-amber-200/60 px-4 py-2 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-50/10"
          >
            {t("cookies.reject")}
          </button>
          <button
            onClick={acceptCookies}
            className="rounded-lg bg-[#bc6c25] px-4 py-2 text-sm font-semibold text-[#fefae0] transition-colors hover:bg-[#bc6c25]/90"
          >
            {t("cookies.accept")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
