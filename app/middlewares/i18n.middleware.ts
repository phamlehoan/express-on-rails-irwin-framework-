/**
 * I18n middleware - detect locale and expose t() to views.
 */
import { Request, Response, NextFunction } from "express";
import { i18next } from "@configs/i18n";

const LOCALE_COOKIE = "locale";
const SUPPORTED_LOCALES = ["en", "vi"];

function detectLocale(req: Request): string {
  const fromQuery = req.query.locale as string;
  if (fromQuery && SUPPORTED_LOCALES.includes(fromQuery)) return fromQuery;

  const fromCookie = req.cookies?.[LOCALE_COOKIE];
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie)) return fromCookie;

  const acceptLang = req.headers["accept-language"];
  if (acceptLang) {
    const preferred = acceptLang.split(",")[0]?.split("-")[0]?.toLowerCase();
    if (preferred && SUPPORTED_LOCALES.includes(preferred)) return preferred;
  }

  return "en";
}

export function i18nMiddleware(req: Request, res: Response, next: NextFunction) {
  const locale = detectLocale(req);
  (req as any).locale = locale;

  if (req.query.locale && SUPPORTED_LOCALES.includes(req.query.locale as string)) {
    res.cookie(LOCALE_COOKIE, locale, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
  }

  res.locals.t = (key: string, options?: Record<string, unknown>) => {
    return i18next.t(key, { ...options, lng: locale });
  };
  res.locals.locale = locale;
  const messages = i18next.getResourceBundle(locale, "common") as Record<string, unknown> | undefined;
  res.locals.i18nMessages = messages || {};
  res.locals.localeUrl = (lng: string) => {
    const url = new URL(req.originalUrl || "/", `http://${req.get("host")}`);
    url.searchParams.set("locale", lng);
    return url.pathname + url.search;
  };

  const t = res.locals.t as (k: string) => string;
  const path = req.path || "";
  if (path.startsWith("/admin/users")) {
    res.locals.activeMenu = "users";
    res.locals.pageTitle = path === "/admin/users" ? t("admin.user_management") : t("sidebar.account_management");
  } else if (path.startsWith("/admin/roles")) {
    res.locals.activeMenu = "roles";
    res.locals.pageTitle = path === "/admin/roles" ? t("admin.role_management") : t("sidebar.roles_permissions");
  } else if (path.startsWith("/admin/features")) {
    res.locals.activeMenu = "features";
    res.locals.pageTitle = path === "/admin/features" ? t("admin.feature_management") : t("sidebar.features");
  } else if (path.startsWith("/admin/me")) {
    res.locals.activeMenu = "profile";
    res.locals.pageTitle = t("profile.my_profile");
  } else if (path.startsWith("/dev")) {
    res.locals.activeMenu = "dev";
    res.locals.pageTitle = t("sidebar.dev");
  } else {
    res.locals.activeMenu = "";
    res.locals.pageTitle = "";
  }

  next();
}
