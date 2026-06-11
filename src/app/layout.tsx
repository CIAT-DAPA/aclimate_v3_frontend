import { Montserrat } from "next/font/google";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "@/app/hooks/useAuth";
import { CountryProvider } from "@/app/contexts/CountryContext";
import { StationsProvider } from "@/app/contexts/StationsContext";
import { I18nProvider } from "@/app/contexts/I18nContext";
import { CookieConsentProvider } from "@/app/contexts/CookieConsentContext";
import { ColorProvider } from "@/app/contexts/ColorContext";
import CookieBanner from "./components/CookieBanner";
import AnalyticsByConsent from "./components/AnalyticsByConsent";
import { buildRootMetadata } from "./seo";
import { getBranchConfig } from "./configs";

config.autoAddCss = false;

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata = buildRootMetadata();

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Color variables are set in globals.css as defaults */}
        {/* ColorProvider will update them after hydration based on country config */}
      </head>
      <body className={`${montserrat.variable} antialiased`}>
        <ColorProvider>
          <I18nProvider>
            <CookieConsentProvider>
              <AuthProvider>
                <CountryProvider>
                  <StationsProvider>
                    <Header />
                    {children}
                    <Footer />
                  </StationsProvider>
                </CountryProvider>
              </AuthProvider>
              <CookieBanner />
              <AnalyticsByConsent
                gaId={getBranchConfig().analytics?.gaId ?? ""}
              />
            </CookieConsentProvider>
          </I18nProvider>
        </ColorProvider>
      </body>
    </html>
  );
}
