"use client";
import Link from "next/link";
import Image from "next/image";
import { useCountry } from "@/app/contexts/CountryContext";
import { useAuth } from "@/app/hooks/useAuth";
import { useState, useEffect } from "react";
import { faArrowRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Header = () => {
  const { userInfo, userValidatedInfo, loading, authenticated, login, logout } = useAuth();
  const { countryId, countryName } = useCountry();
  const [showUserMenu, setShowUserMenu] = useState(false);
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
    <header className="bg-[#283618] shadow-sm">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/img/logo.png"
            alt="AClimate Logo"
            width={32}
            height={32}
          />
          <span className="text-xl font-normal text-amber-50">AClimate {countryName}</span>
        </Link>
        <div className="flex gap-6">
          {countryName?.toLowerCase() !== "honduras" && (
            <Link
              href="/locations"
              className="text-amber-50 hover:text-amber-100 transition-colors mt-2"
            >
              Estaciones
            </Link>
          )}
          <Link
            href={`/spatial/${countryId || '1'}`}
            className="text-amber-50 hover:text-amber-100 transition-colors mt-2"
          >
            Datos espaciales
          </Link>
          {/* Botón de login/usuario */}
          {countryName?.toLowerCase() !== "honduras" && (
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
                        title={userInfo?.preferred_username || userInfo?.name || 'User'}
                      >
                        {getInitials(userInfo?.given_name || '', userInfo?.family_name || '')}
                      </button>

                      {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[1001]">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {userInfo?.name || userInfo?.preferred_username}
                            </p>
                            <p className="text-xs text-gray-500">{userInfo?.email}</p>
                          </div>
                          <Link
                            href={`/user-profile/${userValidatedInfo?.user?.id || userValidatedInfo?.id}`}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FontAwesomeIcon icon={faUser} className="h-4 w-4 mr-2" />
                            Mi perfil
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-4 w-4 mr-2" />
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
      </nav>
    </header>
  );
};

export default Header;
