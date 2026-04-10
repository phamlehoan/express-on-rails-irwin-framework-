/**
 * Vue i18n - dùng messages từ server (window.__I18N__).
 */
declare global {
  interface Window {
    __I18N__?: { locale: string; messages: Record<string, unknown> };
  }
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((o: unknown, k) => {
    if (o && typeof o === 'object' && k in o) return (o as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

export function createT(messages: Record<string, unknown>): (key: string, opts?: Record<string, string | number>) => string {
  return (key: string, opts?: Record<string, string | number>) => {
    let val = getNested(messages, key);
    if (typeof val !== 'string') val = key;
    let s = String(val);
    if (opts) {
      Object.entries(opts).forEach(([k, v]) => {
        s = s.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return s;
  };
}

export function getI18n() {
  const data = window.__I18N__ || { locale: 'en', messages: {} };
  return {
    locale: data.locale,
    messages: data.messages as Record<string, unknown>,
    t: createT(data.messages as Record<string, unknown>),
  };
}
