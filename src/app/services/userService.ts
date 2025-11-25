import { USERS_FRONTEND_API_URL_BASE } from "@/app/config";
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
    const base = process.env.NEXT_PUBLIC_AUTH_API_URL || USERS_FRONTEND_API_URL_BASE;
    const url = `${base}${base.endsWith('/') ? '' : '/'}auth/token/validate`;
    const response = await fetch(url, {
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

export interface UserValidationRequest {
  email: string;
  email_verified: boolean;
  family_name: string;
  given_name: string;
  name: string;
  preferred_username: string;
  sub: string;
  app_id: string;
  profile: string;
}

interface UserValidationResponse {
  exists: boolean;
  user: {
    id: number;
    ext_key_clock_id: string;
    app_id: string;
    profile: string;
    enable: boolean;
    created_at?: string;
    updated_at?: string;
  };
}

/**
 * Valida un usuario con el servidor de autenticación
 * @param userData - Los datos del usuario a validar
 * @returns UserValidationResponse con el resultado de la validación
 */
export const validateUser = async (userData: UserValidationRequest): Promise<UserValidationResponse> => {
  try {
    const base = process.env.NEXT_PUBLIC_API_FRONTEND_BASE_URL || USERS_FRONTEND_API_URL_BASE;
    const url = `${base}${base.endsWith('/') ? '' : '/'}validate/user`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: UserValidationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error validating user:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// Interfaces for User Stations
interface WsInterestedRequest {
  ws_ext_id: string;
  notification: Record<string, any>;
}

interface WsInterestedUpdateRequest {
  notification?: Record<string, any>;
}

interface WsInterestedRead {
  id: number;
  user_id: number;
  ws_ext_id: string;
  notification: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get all weather stations for a user
 * @param userId - The ID of the user
 * @returns List of weather stations the user is interested in
 */
export const getUserStations = async (userId: number): Promise<WsInterestedRead[]> => {
  try {
    const baseUrl = USERS_FRONTEND_API_URL_BASE;
    const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}user-stations/${userId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Si el usuario no tiene estaciones (404), devolver array vacío sin mostrar error
    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Si es un error de red o cualquier otro error que no sea 404
    if (error instanceof Error && error.message.includes('404')) {
      return [];
    }
    console.error('Error getting user stations:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

/**
 * Add a weather station to user interests
 * @param userId - The ID of the user
 * @param stationData - Weather station data including ws_ext_id and notification settings
 * @returns The created weather station interest record
 */
export const addUserStation = async (userId: number, stationData: WsInterestedRequest): Promise<WsInterestedRead> => {
  try {
    const baseUrl = USERS_FRONTEND_API_URL_BASE;
    const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}user-stations/${userId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      
      // Si es un error 400, probablemente la estación ya está agregada
      if (response.status === 400) {
        throw new Error(errorData.detail || errorData.message || 'La estación ya está en favoritos');
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding user station:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

/**
 * Update notification settings for a user's weather station interest
 * @param userId - The ID of the user
 * @param wsExtId - The external weather station ID
 * @param updateData - Updated notification settings
 * @returns The updated weather station interest record
 */
export const updateUserStation = async (
  userId: number,
  wsExtId: string,
  updateData: WsInterestedUpdateRequest
): Promise<WsInterestedRead> => {
  try {
    const baseUrl = USERS_FRONTEND_API_URL_BASE;
    const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}user-stations/${userId}/${wsExtId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user station:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

/**
 * Remove a weather station from user interests
 * @param userId - The ID of the user
 * @param wsExtId - The external weather station ID to remove
 * @returns Success message
 */
export const deleteUserStation = async (userId: number, wsExtId: string): Promise<{ message: string }> => {
  try {
    const baseUrl = USERS_FRONTEND_API_URL_BASE;
    const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}user-stations/${userId}/${wsExtId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting user station:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

// User Profile Management
export type UserProfile = 'FARMER' | 'TECHNICIAN';

interface UpdateProfileRequest {
  profile: UserProfile;
}

interface UpdateProfileResponse {
  id: number;
  ext_key_clock_id: string;
  app_id: string;
  profile: UserProfile;
  enable: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Update user profile type
 * @param userId - The ID of the user
 * @param profile - The new profile type (FARMER or TECHNICIAN)
 * @param token - Authentication token
 * @returns The updated user data
 */
export const updateUserProfile = async (
  userId: number,
  profile: UserProfile,
  token: string
): Promise<UpdateProfileResponse> => {
  try {
    const baseUrl = USERS_FRONTEND_API_URL_BASE;
    const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}user/${userId}/profile`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};