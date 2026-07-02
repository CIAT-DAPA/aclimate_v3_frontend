"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCountry } from "@/app/contexts/CountryContext";
import { useAuth } from "@/app/hooks/useAuth";
import { SHOW_STATIONS_MODULE, SHOW_USERS_MODULE } from "@/app/config";
import { useBranchConfig } from "@/app/configs/index";
import { useState, useEffect } from "react";
import { useI18n } from "@/app/contexts/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { uiIcons } from "@/app/components/ui/icons";

const Header = () => {
  const { userInfo, userValidatedInfo, loading, authenticated, login, logout } =
    useAuth();
  const { countryName } = useCountry();
  const { t } = useI18n();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const config = useBranchConfig();

  // Efecto para manejar el montaje del componente
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const getInitials = (firstName?: string, lastName?: string) => {
    const initials = [];
    if (firstName) initials.push(firstName.charAt(0).toUpperCase());
    if (lastName) initials.push(lastName.charAt(0).toUpperCase());

    // Si no hay iniciales, usar la primera letra del nombre de usuario
    if (initials.length === 0 && userInfo?.preferred_username) {
      initials.push(userInfo.preferred_username.charAt(0).toUpperCase());
    }

    return initials.join("") || "U";
  };

  return (
    <header style={{ backgroundColor: "var(--color-primary)" }} className="shadow-sm relative">
      <nav className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <Image
            src={config.headerLogo?.src || "/assets/img/logo.png"}
            alt={config.headerLogo?.alt || t("common.logoAlt")}
            width={config.headerLogo?.width ?? 32}
            height={config.headerLogo?.height ?? 32}
          />
          <span className="text-lg sm:text-xl font-normal" style={{ color: "var(--color-text-light)" }}>
            AClimate {countryName.replace(/Amazonia/gi, "Amazonía")}
          </span>
        </Link>

          {/* Menú hamburguesa para móvil - más visible */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded-lg transition-all bg-white/10 hover:bg-white/20 border border-white/20 min-w-[44px] min-h-[44px]"
          style={{ color: "var(--color-text-light)" }}
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          aria-label={t("nav.menu")}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {showMobileMenu ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Menú desktop */}
        <div className="hidden md:flex gap-6">
          {config.showScenario && (
            <Link
              href="/scenario"
              className={`transition-colors mt-2 pb-1 ${pathname === "/scenario" ? "font-bold border-b-2" : "hover:opacity-80"}`}
              style={{ color: "var(--color-text-light)", borderBottomColor: pathname === "/scenario" ? "var(--color-secondary)" : "transparent" }}
            >
              {t("nav.scenarios")}
            </Link>
          )}
          {SHOW_STATIONS_MODULE && (
            <Link
              href="/locations"
              className={`transition-colors mt-2 pb-1 ${pathname?.startsWith("/locations") ? "font-bold border-b-2" : "hover:opacity-80"}`}
              style={{ color: "var(--color-text-light)", borderBottomColor: pathname?.startsWith("/locations") ? "var(--color-secondary)" : "transparent" }}
            >
              {t("nav.stations")}
            </Link>
          )}
          <Link
            href="/spatial"
            className={`transition-colors mt-2 pb-1 ${pathname === "/spatial" ? "font-bold border-b-2" : "hover:opacity-80"}`}
            style={{ color: "var(--color-text-light)", borderBottomColor: pathname === "/spatial" ? "var(--color-secondary)" : "transparent" }}
          >
            {t("nav.spatialData")}
          </Link>
          {config.name === "amazonia" && (
            <a
              href="https://ezapatacaldas.github.io/climate-dashboard-sat-pma/"
              target="_blank"
              rel="noreferrer"
              className="transition-colors mt-2 pb-1"
              style={{ color: "var(--color-text-light)" }}
            >
              {t("nav.communityMonitoring")}
            </a>
          )}

          {/* Botón de login/usuario */}
          {SHOW_USERS_MODULE && (
            <div className="flex items-center min-w-[40px] min-h-[40px]">
              {!isMounted ? (
                <div className="w-10 h-10"></div>
              ) : (
                <>
                  {loading && (
                    <div
                      className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full"
                      style={{ borderColor: "var(--color-text-light)", borderTopColor: "transparent" }}
                    ></div>
                  )}

                  {!loading && !authenticated && (
                    <button
                      onClick={login}
                      className="flex items-center justify-between p-2 transition-colors"
                      style={{ color: "var(--color-text-light)" }}
                    >
                      {t("nav.login")}
                    </button>
                  )}

                  {!loading && authenticated && (
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center justify-center w-10 h-10 font-semibold rounded-full transition-colors cursor-pointer"
                        style={{
                          backgroundColor: "var(--color-tertiary)",
                          color: "var(--color-text-light)",
                        }}
                        title={
                          userInfo?.preferred_username ||
                          userInfo?.name ||
                          t("nav.userFallback")
                        }
                      >
                        {getInitials(
                          userInfo?.given_name || "",
                          userInfo?.family_name || "",
                        )}
                      </button>

                      {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[1001]">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {userInfo?.name || userInfo?.preferred_username}
                            </p>
                            <p className="text-xs text-gray-500">
                              {userInfo?.email}
                            </p>
                          </div>
                          <Link
                            href="/user-profile"
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FontAwesomeIcon
                              icon={uiIcons.profile}
                              className="h-4 w-4 mr-2"
                            />
                            {t("nav.profile")}
                          </Link>
                          <Link
                            href="/favorites"
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FontAwesomeIcon
                              icon={uiIcons.favorites}
                              className="h-4 w-4 mr-2"
                            />
                            {t("nav.favorites")}
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            <FontAwesomeIcon
                              icon={uiIcons.logout}
                              className="h-4 w-4 mr-2"
                            />
                            {t("nav.logout")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Menú móvil */}
        {showMobileMenu && (
          <div
            className="absolute top-full left-0 right-0 border-t md:hidden z-[1002]"
            style={{ backgroundColor: "var(--color-primary)", borderTopColor: "var(--color-secondary)" }}
          >
            <div className="container mx-auto px-4 py-2 flex flex-col gap-2">
              {config.showScenario && (
                <Link
                  href="/scenario"
                  className="transition-colors py-2 px-2"
                  style={{ color: "var(--color-text-light)" }}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t("nav.scenarios")}
                </Link>
              )}
              {SHOW_STATIONS_MODULE && (
                <Link
                  href="/locations"
                  className="transition-colors py-2 px-2"
                  style={{ color: "var(--color-text-light)" }}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t("nav.stations")}
                </Link>
              )}
              <Link
                href="/spatial"
                className="transition-colors py-2 px-2"
                style={{ color: "var(--color-text-light)" }}
                onClick={() => setShowMobileMenu(false)}
              >
                {t("nav.spatialData")}
              </Link>
              {config.name === "amazonia" && (
                <a
                  href="https://ezapatacaldas.github.io/climate-dashboard-sat-pma/"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors py-2 px-2"
                  style={{ color: "var(--color-text-light)" }}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t("nav.communityMonitoring")}
                </a>
              )}
          <Link
                href="/about"
                className={`transition-colors py-2 px-2 ${pathname === "/about" ? "font-bold" : ""}`}
                style={{ color: "var(--color-text-light)" }}
                onClick={() => setShowMobileMenu(false)}
              >
                {t("nav.about")}
              </Link>
              {SHOW_USERS_MODULE && (
                <div className="py-2 px-2 border-t mt-2" style={{ borderTopColor: "var(--color-secondary)" }}>
                  {!loading && !authenticated && (
                    <button
                      onClick={() => {
                        login();
                        setShowMobileMenu(false);
                      }}
                      className="transition-colors w-full text-left"
                      style={{ color: "var(--color-text-light)" }}
                    >
                      {t("nav.login")}
                    </button>
                  )}
                  {!loading && authenticated && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2" style={{ color: "var(--color-text-light)" }}>
                        <div
                          className="w-8 h-8 font-semibold rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: "var(--color-tertiary)", color: "var(--color-text-light)" }}
                        >
                          {getInitials(
                            userInfo?.given_name || "",
                            userInfo?.family_name || "",
                          )}
                        </div>
                        <span className="text-sm">
                          {userInfo?.name || userInfo?.preferred_username}
                        </span>
                      </div>
                      <Link
                        href="/user-profile"
                        className="transition-colors text-sm"
                        style={{ color: "var(--color-text-light)" }}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        {t("nav.profile")}
                      </Link>
                      <Link
                        href="/favorites"
                        className="transition-colors text-sm"
                        style={{ color: "var(--color-text-light)" }}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        {t("nav.favorites")}
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowMobileMenu(false);
                        }}
                        className="transition-colors text-sm text-left"
                        style={{ color: "var(--color-text-light)" }}
                      >
                        {t("nav.logout")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;