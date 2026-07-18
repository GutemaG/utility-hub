const fallbackSiteUrl = "https://utility-hub-drab.vercel.app";
const envSiteUrl = import.meta.env.VITE_SITE_URL?.trim();

export const SITE_URL = (envSiteUrl || fallbackSiteUrl).replace(/\/$/, "");
export const SITE_NAME = "Utility Hub";
export const SITE_AUTHOR = "UtilityHub";

export function toolUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
