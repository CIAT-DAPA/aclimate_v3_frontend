"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { getUserStations, updateUserStation, deleteUserStation, updateUserProfile, UserProfile } from "@/app/services/userService";
import { stationService } from "@/app/services/stationService";
import { Station } from "@/app/types/Station";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTemperatureHalf, faCloudRain, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { COUNTRY_NAME } from "@/app/config";


interface UserStation {
  id: number;
  user_id: number;
  ws_ext_id: string;
  notification: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

interface EditModalProps {
  isOpen: boolean;
  station: UserStation | null;
  stationDetails: Station | null;
  onClose: () => void;
  onSave: (wsExtId: string, notification: { email: boolean; push: boolean }) => Promise<void>;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, station, stationDetails, onClose, onSave }) => {
  const [emailNotification, setEmailNotification] = useState(false);
  const [pushNotification, setPushNotification] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (station) {
      setEmailNotification(station.notification?.email || false);
      setPushNotification(station.notification?.push || false);
    }
  }, [station]);

  const handleSave = async () => {
    if (!station) return;
    
    setSaving(true);
    try {
      await onSave(station.ws_ext_id, {
        email: emailNotification,
        push: pushNotification
      });
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al actualizar la suscripción");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !station || !stationDetails) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Editar suscripción</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Estación:</strong> {stationDetails.name}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Ubicación:</strong> {stationDetails.admin2_name}, {stationDetails.country_name}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="email"
              checked={emailNotification}
              onChange={(e) => setEmailNotification(e.target.checked)}
              className="w-4 h-4 text-[#bc6c25] bg-gray-100 border-gray-300 rounded focus:ring-[#bc6c25]"
            />
            <label htmlFor="email" className="ml-2 text-sm font-medium text-gray-900">
              Notificaciones por correo electrónico
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="push"
              checked={pushNotification}
              onChange={(e) => setPushNotification(e.target.checked)}
              className="w-4 h-4 text-[#bc6c25] bg-gray-100 border-gray-300 rounded focus:ring-[#bc6c25]"
            />
            <label htmlFor="push" className="ml-2 text-sm font-medium text-gray-900">
              Notificaciones push
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ffc107] rounded-lg hover:bg-[#ffb300] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { userValidatedInfo, authenticated, loading: authLoading, userInfo, token } = useAuth();
  const [userStations, setUserStations] = useState<UserStation[]>([]);
  const [stationDetails, setStationDetails] = useState<Record<string, Station>>({});
  const [loading, setLoading] = useState(true);
  const [editingStation, setEditingStation] = useState<UserStation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<'FARMER' | 'TECHNICIAN'>('FARMER');
  const [savingProfile, setSavingProfile] = useState(false);

  const userId = params.id as string;

  useEffect(() => {
    if (authLoading) return;

    if (!authenticated || !userValidatedInfo) {
      router.push('/');
      return;
    }

    // Verificar que el usuario esté accediendo a su propio perfil
    const userIdFromValidated = userValidatedInfo.user?.id || userValidatedInfo.id;
    if (userIdFromValidated?.toString() !== userId) {
      router.push('/');
      return;
    }

    // Establecer el perfil actual del usuario
    const currentProfile = (userValidatedInfo.user?.profile || userValidatedInfo.profile) as UserProfile;
    if (currentProfile === 'FARMER' || currentProfile === 'TECHNICIAN') {
      setSelectedProfile(currentProfile);
    }

    loadUserStations();
  }, [authenticated, userValidatedInfo, authLoading, userId]);

  const loadUserStations = async () => {
    try {
      setLoading(true);
      const stations = await getUserStations(parseInt(userId));
      setUserStations(stations);

      // Cargar detalles de cada estación
      const details: Record<string, Station> = {};
      await Promise.all(
        stations.map(async (station) => {
          try {
            const detailResponse = await stationService.getById(station.ws_ext_id);
                        
            // La API devuelve un array, tomamos el primer elemento
            if (Array.isArray(detailResponse) && detailResponse.length > 0) {
              details[station.ws_ext_id] = detailResponse[0];
            } else if (detailResponse && !Array.isArray(detailResponse)) {
              // Por si acaso devuelve directamente el objeto
              details[station.ws_ext_id] = detailResponse;
            }
          } catch (error) {
            console.error(`Error loading station ${station.ws_ext_id}:`, error);
          }
        })
      );
      setStationDetails(details);
    } catch (error) {
      console.error("Error loading user stations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStation = (station: UserStation) => {
    setEditingStation(station);
    setShowEditModal(true);
  };

  const handleSaveStation = async (wsExtId: string, notification: { email: boolean; push: boolean }) => {
    try {
      await updateUserStation(parseInt(userId), wsExtId, { notification });
      await loadUserStations();
    } catch (error) {
      console.error("Error updating station:", error);
      throw error;
    }
  };

  const handleDeleteStation = async (wsExtId: string, stationName: string) => {
    if (!confirm(`¿Está seguro que desea desuscribirse de "${stationName}"?`)) {
      return;
    }

    try {
      await deleteUserStation(parseInt(userId), wsExtId);
      await loadUserStations();
    } catch (error) {
      console.error("Error deleting station:", error);
      alert("Error al eliminar la suscripción");
    }
  };

  const handleUpdateProfile = async () => {
    if (!token) {
      alert("No se encontró el token de autenticación");
      return;
    }

    setSavingProfile(true);
    try {
      await updateUserProfile(parseInt(userId), selectedProfile, token);
      
      // Actualizar el estado local del usuario
      if (userValidatedInfo.user) {
        userValidatedInfo.user.profile = selectedProfile;
      } else {
        userValidatedInfo.profile = selectedProfile;
      }
      
      setShowProfileModal(false);
      alert("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error al actualizar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const initials = [];
    if (firstName) initials.push(firstName.charAt(0).toUpperCase());
    if (lastName) initials.push(lastName.charAt(0).toUpperCase());

    if (initials.length === 0 && userInfo?.preferred_username) {
      initials.push(userInfo.preferred_username.charAt(0).toUpperCase());
    }

    return initials.join("") || "U";
  };

  if (authLoading || loading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#bc6c25] border-t-transparent rounded-full"></div>
        </div>
   
      </>
    );
  }

  const userName = userInfo?.name || userInfo?.preferred_username || "Usuario";
  const userEmail = userInfo?.email || "";
  const userInitials = getInitials(userInfo?.given_name || '', userInfo?.family_name || '');
  const currentUserProfile = (userValidatedInfo?.user?.profile || userValidatedInfo?.profile) as UserProfile || 'FARMER';

  return (
    <>
      <main className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-[#283618] text-[#fefae0] font-bold text-xl sm:text-2xl rounded-full flex-shrink-0">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{userName}</h1>
                  <p className="text-sm sm:text-base text-gray-600 truncate">{userEmail}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                      {COUNTRY_NAME}
                    </p>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                      <span className="font-medium">Perfil:</span>
                      <span className="px-2 py-0.5 bg-[#283618] text-[#fefae0] rounded text-xs font-medium">
                        {currentUserProfile === 'FARMER' ? 'Agricultor' : 'Técnico'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-900 bg-[#ffc107] rounded-lg hover:bg-[#ffb300] transition-colors w-full sm:w-auto whitespace-nowrap"
              >
                Cambiar perfil
              </button>
            </div>
          </div>

          {/* Subscriptions Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Boletines suscritos</h2>
            <p className="text-gray-600 mb-6">Este es un listado a los boletines que estas suscrito</p>

            {/* Climate Bulletins */}
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                <FontAwesomeIcon icon={faTemperatureHalf} className="text-[#bc6c25]" />
                Boletines climáticos
              </h3>

              {userStations.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No tienes estaciones suscritas</p>
              ) : (
                <div className="space-y-4">
                  {userStations.map((station) => {
                    const details = stationDetails[station.ws_ext_id];
                    return (
                      <div key={station.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                          <div className="flex-1 w-full sm:w-auto">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                              {details ? details.name : `Estación #${station.ws_ext_id}`}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {details ? `${details.admin2_name}, ${details.country_name}` : 'Cargando...'}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleEditStation(station)}
                              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-900 bg-[#ffc107] rounded-lg hover:bg-[#ffb300] transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                              <FontAwesomeIcon icon={faPencil} className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="whitespace-nowrap">Editar suscripción</span>
                            </button>
                            <button
                              onClick={() => handleDeleteStation(station.ws_ext_id, details?.name || `Estación #${station.ws_ext_id}`)}
                              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#f44336] rounded-lg hover:bg-[#d32f2f] transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                              <FontAwesomeIcon icon={faTrash} className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="whitespace-nowrap">Desuscribirse</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Forecast Bulletins - Placeholder for future implementation */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                <FontAwesomeIcon icon={faCloudRain} className="text-[#bc6c25]" />
                Boletines de pronósticos
              </h3>
              <p className="text-gray-500 text-sm italic">Próximamente disponible</p>
            </div>
          </div>
        </div>
      </main>
      <EditModal
        isOpen={showEditModal}
        station={editingStation}
        stationDetails={editingStation ? stationDetails[editingStation.ws_ext_id] : null}
        onClose={() => {
          setShowEditModal(false);
          setEditingStation(null);
        }}
        onSave={handleSaveStation}
      />

      {/* Modal de cambio de perfil */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Cambiar perfil de usuario</h3>
            
            <p className="text-sm text-gray-600 mb-6">
              Selecciona el tipo de perfil que mejor describe tu rol en la plataforma.
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                <input
                  type="radio"
                  name="profile"
                  value="FARMER"
                  checked={selectedProfile === 'FARMER'}
                  onChange={(e) => setSelectedProfile(e.target.value as UserProfile)}
                  className="mt-1 w-4 h-4 text-[#bc6c25] bg-gray-100 border-gray-300 focus:ring-[#bc6c25]"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Agricultor</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Persona dedicada a la producción agrícola que utiliza la información climática para la toma de decisiones en sus cultivos.
                  </p>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                <input
                  type="radio"
                  name="profile"
                  value="TECHNICIAN"
                  checked={selectedProfile === 'TECHNICIAN'}
                  onChange={(e) => setSelectedProfile(e.target.value as UserProfile)}
                  className="mt-1 w-4 h-4 text-[#bc6c25] bg-gray-100 border-gray-300 focus:ring-[#bc6c25]"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Técnico</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Profesional o técnico especializado en asesoría agrícola, extensión rural o análisis de información climática.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  // Restaurar el perfil original
                  const currentProfile = (userValidatedInfo?.user?.profile || userValidatedInfo?.profile) as UserProfile;
                  if (currentProfile === 'FARMER' || currentProfile === 'TECHNICIAN') {
                    setSelectedProfile(currentProfile);
                  }
                }}
                disabled={savingProfile}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="px-4 py-2 text-sm font-medium text-white bg-[#ffc107] rounded-lg hover:bg-[#ffb300] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingProfile ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
