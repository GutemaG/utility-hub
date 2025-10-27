import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import MDEditor from "@uiw/react-md-editor";

// Lightweight SEO injector for this page
function Seo({ title, description, keywords }: { title: string; description: string; keywords?: string }) {
  useEffect(() => {
    const ensureMetaName = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    const ensureMetaProp = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    const ensureLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // Title
    document.title = title;

    // Basic
    ensureMetaName("description", description);
    if (keywords) ensureMetaName("keywords", keywords);
    ensureMetaName("robots", "index,follow");

    // Open Graph
    const url = window.location.href;
    ensureMetaProp("og:title", title);
    ensureMetaProp("og:description", description);
    ensureMetaProp("og:type", "website");
    ensureMetaProp("og:url", url);

    // Twitter
    ensureMetaName("twitter:card", "summary_large_image");
    ensureMetaName("twitter:title", title);
    ensureMetaName("twitter:description", description);

    // Canonical
    ensureLink("canonical", url);

    // JSON-LD
    const ld = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: title,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description,
      url,
      featureList: [
        "Live preview",
        "Scroll sync",
        "GitHub-Flavored Markdown",
        "Code syntax highlighting",
        "Copy and download .md",
      ],
    };
    const scriptId = "markdown-editor-jsonld";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(ld);
  }, [title, description, keywords]);

  return null;
}

export const Route = createFileRoute("/mark-down-editor")({
  component: RouteComponent,
});

function RouteComponent() {
  const [markdown, setMarkdown] = useState("**Hello**");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      /* empty */
    }
  };
  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className=" mx-auto p-4 sm:p-6 space-y-4">
      {/* SEO for this page */}
      <Seo
        title="Markdown Editor | UtilityHub"
        description="Write Markdown with live preview, scroll sync, and quick copy/download. Supports GitHub-Flavored Markdown."
        keywords="markdown editor, live preview, GFM, scroll sync, utility-hub"
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Markdown Editor</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMarkdown("")}
            className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
            title="Reset to sample"
          >
            Clear
          </button>
          <button
            onClick={copy}
            className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
            title="Copy markdown"
          >
            Copy
          </button>
          <button
            onClick={download}
            className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
            title="Download .md"
          >
            Download
          </button>
        </div>
      </div>

      <MDEditor
        value={markdown}
        onChange={(value) => setMarkdown(value ?? "")}
        enableScroll={true}
        height={600}
        textareaProps={
          {
            placeholder: "Please write your markdown here",
          }
        }
      />
    </div>
  );
}

export default RouteComponent;
