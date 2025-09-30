"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
} from "react";
import Keycloak, { KeycloakTokenParsed } from "keycloak-js";
import { validateToken } from "@/app/services/authService";

interface ValidationPayload {
  valid: boolean;
  payload?: any;
}

interface AuthContextType {
  userInfo: any | null;
  token: string | null;
  tokenParsed: KeycloakTokenParsed | null;
  login: () => void;
  logout: () => void;
  validatedPayload: any | null;
  loading: boolean;
  authenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Inicializar loading como false en el servidor para evitar problemas de hidratación
  const [loading, setLoading] = useState<boolean>(() => 
    typeof window === 'undefined' ? false : true
  );
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenParsed, setTokenParsed] = useState<KeycloakTokenParsed | null>(null);
  const isRun = useRef<boolean>(false);
  const keycloak = useRef<Keycloak | null>(null);
  const [validatedPayload, setValidatedPayload] = useState<any | null>(null);
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    if (isRun.current) return;
    isRun.current = true;

    const initializeKeycloak = async () => {
      try {
        keycloak.current = new Keycloak({
          url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
          realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "aclimate-realm",
          clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "aclimate-frontend",
        });

        const isAuthenticated = await keycloak.current.init({ 
          onLoad: "check-sso",
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          checkLoginIframe: false // Deshabilitar la verificación del iframe para evitar problemas
        });

        setAuthenticated(isAuthenticated);

        if (isAuthenticated && keycloak.current) {
          const currentToken = keycloak.current.token;
          setToken(currentToken || null);
          setTokenParsed(keycloak.current.tokenParsed || null);

          try {
            const userInfo = await keycloak.current.loadUserInfo();
            setUserInfo(userInfo);

            if (currentToken) {
              const validation = await validateToken(currentToken);
              if (validation.valid) {
                setValidatedPayload(validation.payload);
              }
            }
          } catch (userError) {
            console.error("Error loading user info:", userError);
            setAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Error inicializando Keycloak:", error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeKeycloak();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (keycloak.current) {
        try {
          const refreshed = await keycloak.current.updateToken(60);
          if (refreshed && keycloak.current) {
            const currentToken = keycloak.current.token;
            setToken(currentToken || null);
            setTokenParsed(keycloak.current.tokenParsed || null);
          }
        } catch (error) {
          console.warn("No se pudo actualizar el token, cerrando sesión");
          logout();
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log(userInfo);
  }, [userInfo]);

  const login = () => {
    if (keycloak.current) {
      keycloak.current.login();
    } else {
      console.error("Keycloak no está inicializado");
    }
  };

  const logout = () => {
    if (keycloak.current) {
      keycloak.current.logout({ redirectUri: window.location.origin });
      setUserInfo(null);
      setToken(null);
      setTokenParsed(null);
      setValidatedPayload(null);
      setAuthenticated(false);
    }
  };

  const contextValue: AuthContextType = {
    userInfo,
    token,
    tokenParsed,
    login,
    logout,
    validatedPayload,
    loading,
    authenticated
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};