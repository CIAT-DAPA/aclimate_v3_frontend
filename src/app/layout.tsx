import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "@/app/hooks/useAuth";
import { CountryProvider } from "@/app/contexts/CountryContext";
import { StationsProvider } from "@/app/contexts/StationsContext";
import { COUNTRY_NAME } from "./config";
import { getBranchConfig } from "./configs";
import { CookieConsentProvider } from "@/app/contexts/CookieConsentContext";
import CookieBanner from "./components/CookieBanner";
import AnalyticsByConsent from "./components/AnalyticsByConsent";

config.autoAddCss = false;

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const COUNTRY_LABEL = COUNTRY_NAME.replace(/Amazonia/gi, "Amazonía");
const SITE_TITLE = `AClimate ${COUNTRY_LABEL}`;
const SITE_DESCRIPTION =
  "Explora, monitorea y compara datos climáticos y agroclimáticos con estaciones y satélites. Consulta mapas, indicadores y escenarios para tu región.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  keywords: [
    "clima",
    "agroclimático",
    "datos climáticos",
    "estaciones",
    "mapas",
    "indicadores",
    "escenarios",
    COUNTRY_LABEL,
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_TITLE,
    locale: "es",
    images: ["/assets/img/bg.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/assets/img/bg.jpg"],
  },
};

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
      <body className={`${montserrat.variable} antialiased`}>
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
          <AnalyticsByConsent gaId={getBranchConfig().analytics?.gaId ?? ""} />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
