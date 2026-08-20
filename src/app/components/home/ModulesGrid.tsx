"use client";

import { useBranchConfig } from "@/app/configs";
import { getAvailableModules } from "@/app/configs/modules";
import ModuleCard from "./ModuleCard";
import { useI18n } from "@/app/contexts/I18nContext";

export default function ModulesGrid() {
  const config = useBranchConfig();
  const modules = getAvailableModules(config);
  const { t } = useI18n();

  if (modules.length === 0) return null;

  return (
    <section className="bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2" style={{ color: "var(--color-text-dark)" }}>
          {t("home.modules.sectionTitle")}
        </h2>
        <p className="text-center text-gray-500 mb-8 sm:mb-10 max-w-2xl mx-auto">
          {t("home.modules.sectionDescription")}
        </p>
      </div>

      {/* Full-width cards row - CSS Grid garantiza misma altura en todas */}
      <div
        className="grid w-full sm:grid-flow-col sm:auto-cols-fr"
        style={{
          gridAutoRows: "1fr",
        }}
      >
        {modules.map((mod, index) => (
          <div key={mod.key}>
            <ModuleCard module={mod} index={index} />
          </div>
        ))}
      </div>
    </section>
  );
}