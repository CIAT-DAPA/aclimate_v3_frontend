import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "@/app/hooks/useAuth";
import { CountryProvider } from "@/app/contexts/CountryContext";
import { StationsProvider } from "@/app/contexts/StationsContext";
import { COUNTRY_NAME } from "./config";
import { GoogleAnalytics  } from '@next/third-parties/google'

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `AClimate ${COUNTRY_NAME}`,
  description:
    "Explora, monitorea y compara los datos de las estaciones climátologicas con bases de datos satelitales. Informate sobre como ha sido el clima en las regiones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased`}>
        <AuthProvider>
          <CountryProvider>
            <StationsProvider>
              <Header />
              {children}
              <Footer />
            </StationsProvider>
          </CountryProvider>
        </AuthProvider>
      </body>
      <GoogleAnalytics gaId="G-5XT0B5ZC2P" />
    </html>
  );
}
