import es from "./locales/es.json";
import en from "./locales/en.json";

export const DEFAULT_LOCALE = "es";
export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  es,
  en,
};

const getNestedValue = (source: Record<string, unknown>, key: string) => {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);
};

const interpolate = (
  value: string,
  vars?: Record<string, string | number>,
) => {
  if (!vars) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const replacement = vars[name];
    return replacement === undefined ? "" : String(replacement);
  });
};

export const translate = (
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
) => {
  const message =
    getNestedValue(MESSAGES[locale], key) ??
    getNestedValue(MESSAGES[DEFAULT_LOCALE], key);

  if (typeof message !== "string") {
    return key;
  }

  return interpolate(message, vars);
};
