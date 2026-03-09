/**
 * I18n - tương tự Rails I18n, dùng i18next.
 */
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";

let initialized = false;

export async function initI18n(): Promise<void> {
  if (initialized) return;

  const localesPath = path.join(process.cwd(), "configs", "locales");

  await i18next.use(Backend).init({
    lng: "en",
    fallbackLng: "en",
    preload: ["en", "vi"],
    backend: {
      loadPath: path.join(localesPath, "{{lng}}", "{{ns}}.json"),
    },
    ns: ["common", "errors", "validation"],
    defaultNS: "common",
  });

  initialized = true;
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18next.t(key, options);
}

export { i18next };
