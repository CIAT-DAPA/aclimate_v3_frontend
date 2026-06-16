"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/app/contexts/I18nContext";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer style={{ backgroundColor: "var(--color-primary)" }}>
      <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm" style={{ color: "var(--color-text-light)" }}>
            {t("footer.developedBy")}
          </span>
          <a
            href="https://alliancebioversityciat.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src="/assets/img/partners/Alliance_white.png"
              alt="Alliance Bioversity & CIAT"
              width={120}
              height={40}
              className="h-8 sm:h-10 w-auto"
            />
          </a>
        </div>
        <div className="flex gap-2 sm:gap-4">
          <Link
            href="https://www.aclimate.org/data-policy"
            className="transition-colors text-xs sm:text-sm"
            target="_blank"
            style={{ color: "var(--color-text-light)" }}
          >
            {t("footer.privacyPolicy")}
          </Link>
          <Link
            href="/about"
            className="transition-colors text-xs sm:text-sm"
            style={{ color: "var(--color-text-light)" }}
          >
            {t("footer.about")}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;