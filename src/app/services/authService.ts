
interface TokenValidationResponse {
  valid: boolean;
  payload?: {
    sub?: string;
    email?: string;
    name?: string;
    [key: string]: any;  // Para otros campos que puedan venir en el payload
  };
  error?: string;
}

/**
 * Valida un token JWT con el servidor de autenticación
 * @param token - El token JWT a validar
 * @returns TokenValidationResponse con el resultado de la validación
 */
export const validateToken = async (token: string): Promise<TokenValidationResponse> => {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://127.0.0.1:8000/auth/token/validate', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: TokenValidationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error validating token:', error instanceof Error ? error.message : 'Unknown error');
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};