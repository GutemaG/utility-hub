import { useEffect } from "react";
import { SITE_AUTHOR, toolUrl } from "@/config/site";

export interface SEOOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  applicationCategory?: string;
  featureList?: string[];
}

export function useSEO({
  title,
  description,
  path,
  keywords,
  applicationCategory = "Tool",
  featureList = [],
}: SEOOptions) {
  useEffect(() => {
    document.title = title;

    const ensureMeta = (name: string, content: string) => {
      let el = document.querySelector(
        `meta[name="${name}"]`
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const ensureProperty = (property: string, content: string) => {
      let el = document.querySelector(
        `meta[property="${property}"]`
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    ensureMeta("description", description);
    if (keywords) ensureMeta("keywords", keywords);
    ensureMeta("author", SITE_AUTHOR);
    ensureMeta("robots", "index, follow");
    ensureProperty("og:title", title);
    ensureProperty("og:description", description);
    ensureProperty("og:type", "website");
    ensureProperty("og:url", toolUrl(path));
    ensureMeta("twitter:card", "summary_large_image");
    ensureMeta("twitter:title", title);
    ensureMeta("twitter:description", description);

    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = toolUrl(path);

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: title,
      description,
      url: toolUrl(path),
      applicationCategory,
      operatingSystem: "Web Browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      ...(featureList.length > 0 ? { featureList } : {}),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [title, description, path, keywords, applicationCategory, featureList]);
}
