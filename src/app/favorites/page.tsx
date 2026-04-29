"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { deleteUserStation, getUserStations } from "@/app/services/userService";
import { stationService } from "@/app/services/stationService";
import { Station } from "@/app/types/Station";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "@/app/contexts/I18nContext";

interface UserStation {
  id: number;
  user_id: number;
  ws_ext_id: string;
  notification: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { authenticated, userValidatedInfo, loading: authLoading } = useAuth();
  const [userStations, setUserStations] = useState<UserStation[]>([]);
  const [stationDetails, setStationDetails] = useState<Record<string, Station>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  const resolvedUserId = userValidatedInfo?.user?.id || userValidatedInfo?.id;
  const userId = resolvedUserId ? resolvedUserId.toString() : "";

  useEffect(() => {
    if (authLoading) return;

    if (!authenticated || !userValidatedInfo) {
      router.push("/");
      return;
    }

    loadUserStations();
  }, [authenticated, userValidatedInfo, authLoading, userId, router]);

  const loadUserStations = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const stations = await getUserStations(parseInt(userId));
      setUserStations(stations);

      const details: Record<string, Station> = {};
      await Promise.all(
        stations.map(async (station) => {
          try {
            const detailResponse = await stationService.getById(
              station.ws_ext_id,
            );

            if (Array.isArray(detailResponse) && detailResponse.length > 0) {
              details[station.ws_ext_id] = detailResponse[0];
            } else if (detailResponse && !Array.isArray(detailResponse)) {
              details[station.ws_ext_id] = detailResponse;
            }
          } catch (error) {
            console.error(`Error loading station ${station.ws_ext_id}:`, error);
          }
        }),
      );
      setStationDetails(details);
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (wsExtId: string, stationName: string) => {
    if (!userId) return;

    if (!confirm(t("favorites.removeConfirm", { name: stationName }))) {
      return;
    }

    try {
      await deleteUserStation(parseInt(userId), wsExtId);
      setUserStations((prev) =>
        prev.filter((station) => station.ws_ext_id !== wsExtId),
      );
      setStationDetails((prev) => {
        const next = { ...prev };
        delete next[wsExtId];
        return next;
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
      alert(t("favorites.removeError"));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-[#bc6c25] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t("favorites.title")}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {t("favorites.subtitle")}
              </p>
            </div>
          </div>

          {userStations.length === 0 ? (
            <p className="text-gray-500 text-sm italic">
              {t("favorites.empty")}
            </p>
          ) : (
            <div className="space-y-4">
              {userStations.map((station) => {
                const details = stationDetails[station.ws_ext_id];
                const stationName = details
                  ? details.name
                  : t("favorites.stationLabel", { id: station.ws_ext_id });
                const locationLabel = details
                  ? `${details.admin2_name}, ${details.country_name}`
                  : t("favorites.loading");

                return (
                  <div
                    key={station.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex-1 w-full sm:w-auto">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {stationName}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {locationLabel}
                        </p>
                      </div>
                      <div className="flex flex-row flex-wrap gap-2 w-full sm:w-auto">
                        {details?.machine_name && (
                          <Link
                            href={`/m/${details.machine_name}`}
                            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-amber-50 bg-[#bc6c25] rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center"
                          >
                            {t("favorites.view")}
                          </Link>
                        )}
                        <button
                          onClick={() =>
                            handleRemoveFavorite(station.ws_ext_id, stationName)
                          }
                          className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#f44336] rounded-lg hover:bg-[#d32f2f] transition-colors flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          />
                          <span className="whitespace-nowrap">
                            {t("favorites.remove")}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
