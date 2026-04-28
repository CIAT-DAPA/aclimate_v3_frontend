"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { updateUserProfile, UserProfile } from "@/app/services/userService";
import { COUNTRY_NAME } from "@/app/config";

export default function UserProfilePage() {
  const router = useRouter();
  const {
    userValidatedInfo,
    authenticated,
    loading: authLoading,
    userInfo,
    token,
  } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<
    "FARMER" | "TECHNICIAN"
  >("FARMER");
  const [savingProfile, setSavingProfile] = useState(false);

  const resolvedUserId = userValidatedInfo?.user?.id || userValidatedInfo?.id;
  const userId = resolvedUserId ? resolvedUserId.toString() : "";

  useEffect(() => {
    if (authLoading) return;

    if (!authenticated || !userValidatedInfo) {
      router.push("/");
      return;
    }

    const currentProfile = (userValidatedInfo.user?.profile ||
      userValidatedInfo.profile) as UserProfile;
    if (currentProfile === "FARMER" || currentProfile === "TECHNICIAN") {
      setSelectedProfile(currentProfile);
    }
  }, [authenticated, userValidatedInfo, authLoading, router]);

  const handleUpdateProfile = async () => {
    if (!token) {
      alert("No se encontró el token de autenticación");
      return;
    }

    if (!userId) {
      alert("No se encontró el usuario autenticado");
      return;
    }

    setSavingProfile(true);
    try {
      await updateUserProfile(parseInt(userId), selectedProfile, token);

      if (userValidatedInfo?.user) {
        userValidatedInfo.user.profile = selectedProfile;
      } else if (userValidatedInfo) {
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

  const userName = userInfo?.name || userInfo?.preferred_username || "Usuario";
  const userEmail = userInfo?.email || "";
  const countryLabel = COUNTRY_NAME.replace(/Amazonia/gi, "Amazonía");
  const currentUserProfile =
    ((userValidatedInfo?.user?.profile ||
      userValidatedInfo?.profile) as UserProfile) || "FARMER";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-[#bc6c25] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Mi perfil
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Administra tu información y preferencias de cuenta.
                </p>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-amber-50 bg-[#bc6c25] rounded-lg hover:bg-amber-700 transition-colors w-full sm:w-auto whitespace-nowrap"
              >
                Cambiar perfil
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:gap-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Nombre
                </p>
                <p className="text-base sm:text-lg text-gray-900 font-semibold mt-1">
                  {userName}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Correo
                </p>
                <p className="text-base sm:text-lg text-gray-900 font-semibold mt-1">
                  {userEmail || "No disponible"}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  País
                </p>
                <p className="text-base sm:text-lg text-gray-900 font-semibold mt-1">
                  {countryLabel}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Perfil
                </p>
                <p className="text-base sm:text-lg text-gray-900 font-semibold mt-1">
                  {currentUserProfile === "FARMER" ? "Agricultor" : "Técnico"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              Cambiar perfil de usuario
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              Selecciona el tipo de perfil que mejor describe tu rol en la
              plataforma.
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                <input
                  type="radio"
                  name="profile"
                  value="FARMER"
                  checked={selectedProfile === "FARMER"}
                  onChange={(e) =>
                    setSelectedProfile(e.target.value as UserProfile)
                  }
                  className="mt-1 w-4 h-4 text-[#bc6c25] bg-gray-100 border-gray-300 focus:ring-[#bc6c25]"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Agricultor
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Persona dedicada a la producción agrícola que utiliza la
                    información climática para la toma de decisiones en sus
                    cultivos.
                  </p>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                <input
                  type="radio"
                  name="profile"
                  value="TECHNICIAN"
                  checked={selectedProfile === "TECHNICIAN"}
                  onChange={(e) =>
                    setSelectedProfile(e.target.value as UserProfile)
                  }
                  className="mt-1 w-4 h-4 text-[#bc6c25] bg-gray-100 border-gray-300 focus:ring-[#bc6c25]"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Técnico</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Profesional o técnico especializado en asesoría agrícola,
                    extensión rural o análisis de información climática.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  const currentProfile = (userValidatedInfo?.user?.profile ||
                    userValidatedInfo?.profile) as UserProfile;
                  if (
                    currentProfile === "FARMER" ||
                    currentProfile === "TECHNICIAN"
                  ) {
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
                  "Guardar cambios"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
