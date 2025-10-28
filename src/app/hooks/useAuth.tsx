"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
} from "react";
import Keycloak, { KeycloakTokenParsed, KeycloakProfile } from "keycloak-js";
import { validateToken, validateUser, UserValidationRequest } from "@/app/services/userService";
import { APP_ID, KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID } from "@/app/config";

interface ValidationPayload {
  valid: boolean;
  payload?: any;
}

interface AuthContextType {
  userInfo: any | null;
  userValidatedInfo: any | null;
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
  const [userValidatedInfo, setUserValidatedInfo] = useState<any | null>(null);
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
          url: KEYCLOAK_URL,
          realm: KEYCLOAK_REALM,
          clientId: KEYCLOAK_CLIENT_ID,
        });

        const isAuthenticated = await keycloak.current.init({ 
          onLoad: "check-sso",
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          checkLoginIframe: false
        });

        setAuthenticated(isAuthenticated);

        if (isAuthenticated && keycloak.current) {
          const currentToken = keycloak.current.token;
          setToken(currentToken || null);
          setTokenParsed(keycloak.current.tokenParsed || null);

          try {
            const kcProfile = (await keycloak.current.loadUserInfo()) as KeycloakProfile;
            setUserInfo(kcProfile);

            // Validar usuario con el backend
            const userValidationData: UserValidationRequest = {
              email: kcProfile.email || "",
              email_verified: Boolean((kcProfile as any).email_verified),
              family_name: kcProfile.lastName || "",
              given_name: kcProfile.firstName || "",
              name: kcProfile.username || kcProfile.email || "",
              preferred_username: kcProfile.username || "",
              sub: (keycloak.current.tokenParsed?.sub as string) || "",
              app_id: APP_ID, // toma el valor unificado desde config
              profile: (kcProfile as any).profile || ""
            };

            const validatedUser = await validateUser(userValidationData);
            setUserValidatedInfo(validatedUser.user);

            if (currentToken) {
              const validation = await validateToken(currentToken);
              if (validation.valid) {
                setValidatedPayload(validation.payload);
              }
            }
          } catch (userError) {
            console.error("Error loading/validating user:", userError);
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
    // Solo refrescar token si el usuario está autenticado y hay token
    if (!authenticated || !keycloak.current || !token) return;

    const interval = setInterval(async () => {
      try {
        const refreshed = await keycloak.current!.updateToken(60);
        if (refreshed && keycloak.current) {
          const currentToken = keycloak.current.token;
          setToken(currentToken || null);
          setTokenParsed(keycloak.current.tokenParsed || null);
        }
      } catch (error) {
        // Si falla el refresh, no forzar logout/redirect cuando no corresponde.
        // Marcamos estado no autenticado y limpiamos token sin redirigir.
        console.warn("Fallo al refrescar token (ignorado si no autenticado):", error);
        setToken(null);
        setTokenParsed(null);
        setAuthenticated(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [authenticated, token]);

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
    userValidatedInfo,
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