"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useCookieConsent } from "@/app/contexts/CookieConsentContext";

interface AnalyticsByConsentProps {
  gaId: string;
}

const AnalyticsByConsent: React.FC<AnalyticsByConsentProps> = ({ gaId }) => {
  const { consent, isLoaded } = useCookieConsent();

  if (!isLoaded || consent !== "accepted") {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
};

export default AnalyticsByConsent;
