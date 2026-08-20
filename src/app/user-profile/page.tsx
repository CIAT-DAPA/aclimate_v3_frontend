"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { updateUserProfile, UserProfile } from "@/app/services/userService";
import { COUNTRY_NAME } from "@/app/config";
import { useI18n } from "@/app/contexts/I18nContext";
import { UIButton } from "@/app/components/ui/button";

export default function UserProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
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
      alert(t("profile.tokenMissing"));
      return;
    }

    if (!userId) {
      alert(t("profile.userMissing"));
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
      alert(t("profile.profileUpdated"));
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(t("profile.profileUpdateError"));
    } finally {
      setSavingProfile(false);
    }
  };

  const userName =
    userInfo?.name || userInfo?.preferred_username || t("nav.userFallback");
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
                  {t("profile.title")}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {t("profile.subtitle")}
                </p>
              </div>
              <UIButton
                onClick={() => setShowProfileModal(true)}
                className="w-full sm:w-auto whitespace-nowrap"
              >
                {t("profile.changeProfile")}
              </UIButton>
            </div>

            <div className="mt-6 grid gap-4 sm:gap-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t("profile.name")}
                </p>
                <p className="text-base sm:text-lg text-gray-900 font-semibold mt-1">
                  {userName}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t("profile.email")}
                </p>
                <p className="text-base sm:text-lg text-gray-900 font-semibold mt-1">
                  {userEmail || t("profile.emailEmpty")}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t("profile.country")}
                </p>
                <p className="text-base sm:text-lg text-gray-900 font-semibold mt-1">
                  {countryLabel}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t("profile.role")}
                </p>
                <p className="text-base sm:text-lg text-gray-900 font-semibold mt-1">
                  {currentUserProfile === "FARMER"
                    ? t("profile.roleFarmer")
                    : t("profile.roleTechnician")}
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
              {t("profile.modalTitle")}
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              {t("profile.modalSubtitle")}
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
                    {t("profile.roleFarmerTitle")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("profile.roleFarmerDescription")}
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
                  <p className="text-sm font-medium text-gray-900">
                    {t("profile.roleTechnicianTitle")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("profile.roleTechnicianDescription")}
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <UIButton
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
                variant="secondary"
                className="text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-800"
              >
                {t("profile.cancel")}
              </UIButton>
              <UIButton
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="bg-[#ffc107] border-[#ffc107] text-white hover:bg-[#ffb300] hover:border-[#ffb300]"
              >
                {savingProfile ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {t("profile.saving")}
                  </>
                ) : (
                  t("profile.save")
                )}
              </UIButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
