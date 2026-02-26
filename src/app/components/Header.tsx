"use client";
import Link from "next/link";
import Image from "next/image";
import { useCountry } from "@/app/contexts/CountryContext";
import { useAuth } from "@/app/hooks/useAuth";
import { SHOW_STATIONS_MODULE, SHOW_USERS_MODULE } from "@/app/config";
import { useState, useEffect } from "react";
import {
  faArrowRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Header = () => {
  const { userInfo, userValidatedInfo, loading, authenticated, login, logout } =
    useAuth();
  const { countryId, countryName } = useCountry();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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
    <header className="bg-[#283618] shadow-sm relative">
      <nav className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/assets/img/logo.png"
            alt="AClimate Logo"
            width={32}
            height={32}
          />
          <span className="text-lg sm:text-xl font-normal text-amber-50">
            AClimate {countryName.replace(/Amazonia/gi, "Amazonía")}
          </span>
        </Link>

        {/* Menú hamburguesa para móvil */}
        <button
          className="md:hidden text-amber-50 p-2"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
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
          {SHOW_STATIONS_MODULE && (
            <Link
              href="/locations"
              className="text-amber-50 hover:text-amber-100 transition-colors mt-2"
            >
              Estaciones
            </Link>
          )}
          <Link
            href={`/spatial/${countryId || "1"}`}
            className="text-amber-50 hover:text-amber-100 transition-colors mt-2"
          >
            Datos espaciales
          </Link>
          <Link
            href="/about"
            className="text-amber-50 hover:text-amber-100 transition-colors mt-2"
          >
            Acerca de
          </Link>
          {/* Botón de login/usuario */}
          {SHOW_USERS_MODULE && (
            <div className="flex items-center min-w-[40px] min-h-[40px]">
              {!isMounted ? (
                // Estado inicial para SSR
                <div className="w-10 h-10"></div>
              ) : (
                <>
                  {loading && (
                    <div className="animate-spin h-4 w-4 border-2 border-[#ffaf68] border-t-transparent rounded-full"></div>
                  )}

                  {!loading && !authenticated && (
                    <button
                      onClick={login}
                      className="flex items-center justify-between p-2 font-medium text-amber-50 hover:text-amber-100 transition-colors"
                    >
                      Login
                    </button>
                  )}

                  {!loading && authenticated && (
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center justify-center w-10 h-10 bg-[#bc6c25] text-[#fefae0] font-semibold rounded-full hover:bg-[#bc6c25]/90 transition-colors cursor-pointer"
                        title={
                          userInfo?.preferred_username ||
                          userInfo?.name ||
                          "User"
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
                            href={`/user-profile/${userValidatedInfo?.user?.id || userValidatedInfo?.id}`}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FontAwesomeIcon
                              icon={faUser}
                              className="h-4 w-4 mr-2"
                            />
                            Mi perfil
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            <FontAwesomeIcon
                              icon={faArrowRightFromBracket}
                              className="h-4 w-4 mr-2"
                            />
                            Logout
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
          <div className="absolute top-full left-0 right-0 bg-[#283618] border-t border-[#3a4a26] md:hidden z-[1002]">
            <div className="container mx-auto px-4 py-2 flex flex-col gap-2">
              {SHOW_STATIONS_MODULE && (
                <Link
                  href="/locations"
                  className="text-amber-50 hover:text-amber-100 transition-colors py-2 px-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Estaciones
                </Link>
              )}
              <Link
                href={`/spatial/${countryId || "1"}`}
                className="text-amber-50 hover:text-amber-100 transition-colors py-2 px-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Datos espaciales
              </Link>
              <Link
                href="/about"
                className="text-amber-50 hover:text-amber-100 transition-colors py-2 px-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Acerca de
              </Link>
              {SHOW_USERS_MODULE && (
                <div className="py-2 px-2 border-t border-[#3a4a26] mt-2">
                  {!loading && !authenticated && (
                    <button
                      onClick={() => {
                        login();
                        setShowMobileMenu(false);
                      }}
                      className="text-amber-50 hover:text-amber-100 transition-colors w-full text-left"
                    >
                      Login
                    </button>
                  )}
                  {!loading && authenticated && (
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/user-profile/${userValidatedInfo?.user?.id || userValidatedInfo?.id}`}
                        className="text-amber-50 hover:text-amber-100 transition-colors flex items-center gap-2"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <div className="w-8 h-8 bg-[#bc6c25] text-[#fefae0] font-semibold rounded-full flex items-center justify-center text-sm">
                          {getInitials(
                            userInfo?.given_name || "",
                            userInfo?.family_name || "",
                          )}
                        </div>
                        <span className="text-sm">
                          {userInfo?.name || userInfo?.preferred_username}
                        </span>
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowMobileMenu(false);
                        }}
                        className="text-amber-50 hover:text-amber-100 transition-colors text-sm"
                      >
                        Logout
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
