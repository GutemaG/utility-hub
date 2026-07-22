import { Suspense, lazy, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type TurndownServiceType from "turndown";
import { useSEO } from "@/hooks/use-seo";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

export const Route = createFileRoute("/mark-down-editor")({
  component: RouteComponent,
});

const SAMPLE_MARKDOWN = "**Hello**";
const SAMPLE_HTML = "<h1>Hello</h1>\n<p>This is <strong>bold</strong> and <em>italic</em> text.</p>\n<ul>\n  <li>One</li>\n  <li>Two</li>\n</ul>";

// The unified/remark/rehype and turndown pipelines are ~300-400KB combined,
// so each is fetched only the first time its conversion direction is used
// instead of loading on every page in the app.
let mdToHtmlModulesPromise: ReturnType<typeof loadMdToHtmlModules> | null = null;
function loadMdToHtmlModules() {
  return Promise.all([
    import("unified"),
    import("remark-parse"),
    import("remark-gfm"),
    import("remark-rehype"),
    import("rehype-raw"),
    import("rehype-stringify"),
  ]).then(([{ unified }, remarkParse, remarkGfm, remarkRehype, rehypeRaw, rehypeStringify]) => ({
    unified,
    remarkParse: remarkParse.default,
    remarkGfm: remarkGfm.default,
    remarkRehype: remarkRehype.default,
    rehypeRaw: rehypeRaw.default,
    rehypeStringify: rehypeStringify.default,
  }));
}

async function markdownToHtml(markdown: string): Promise<string> {
  if (!markdown.trim()) return "";
  if (!mdToHtmlModulesPromise) mdToHtmlModulesPromise = loadMdToHtmlModules();
  try {
    const { unified, remarkParse, remarkGfm, remarkRehype, rehypeRaw, rehypeStringify } =
      await mdToHtmlModulesPromise;
    const file = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeStringify)
      .processSync(markdown);
    return String(file);
  } catch {
    return "";
  }
}

let turndownServicePromise: Promise<TurndownServiceType> | null = null;
function loadTurndownService() {
  if (!turndownServicePromise) {
    turndownServicePromise = Promise.all([import("turndown"), import("turndown-plugin-gfm")]).then(
      ([{ default: TurndownService }, { gfm }]) => {
        const service = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
        service.use(gfm);
        return service;
      }
    );
  }
  return turndownServicePromise;
}

async function htmlToMarkdown(html: string): Promise<string> {
  if (!html.trim()) return "";
  try {
    const service = await loadTurndownService();
    return service.turndown(html);
  } catch {
    return "";
  }
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type CopyKey = "markdown" | "html" | "htmlSource" | "convertedMarkdown";

function RouteComponent() {
  const [mode, setMode] = useState<"md-to-html" | "html-to-md">("md-to-html");
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [htmlInput, setHtmlInput] = useState(SAMPLE_HTML);
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [html, setHtml] = useState("");
  const [convertedMarkdown, setConvertedMarkdown] = useState("");
  const { resolvedTheme } = useTheme();

  // Only convert (and lazy-load the relevant library) for the visible tab.
  useEffect(() => {
    if (mode !== "md-to-html") return;
    let cancelled = false;
    markdownToHtml(markdown).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, markdown]);

  useEffect(() => {
    if (mode !== "html-to-md") return;
    let cancelled = false;
    htmlToMarkdown(htmlInput).then((result) => {
      if (!cancelled) setConvertedMarkdown(result);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, htmlInput]);

  useSEO({
    title: "Markdown Editor | Utility Hub",
    description:
      "Write Markdown with live preview, convert it to HTML, copy as rich formatted HTML or raw HTML source, and convert HTML back to Markdown.",
    path: "/mark-down-editor",
    keywords:
      "markdown editor, markdown to html, html to markdown, copy as html, live preview, GFM, utility-hub",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "Live preview",
      "GitHub-Flavored Markdown",
      "Convert Markdown to HTML",
      "Copy as rich HTML or raw HTML source",
      "Convert HTML to Markdown",
      "Copy and download output",
    ],
  });

  const flashCopied = (key: CopyKey) => {
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  const copyText = async (text: string, key: CopyKey) => {
    try {
      await navigator.clipboard.writeText(text);
      flashCopied(key);
    } catch {
      /* empty */
    }
  };

  // Copies as a rich, formatted document (text/html) that pastes styled into
  // apps like Gmail/Docs/Word, with a plain-text fallback for plain editors.
  const copyRichHtml = async (htmlStr: string) => {
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        const div = document.createElement("div");
        div.innerHTML = htmlStr;
        const plain = div.textContent ?? "";
        const item = new ClipboardItem({
          "text/html": new Blob([htmlStr], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(htmlStr);
      }
      flashCopied("html");
    } catch {
      /* empty */
    }
  };

  const openConvertedMarkdownInEditor = () => {
    setMarkdown(convertedMarkdown);
    setMode("md-to-html");
  };

  return (
    <div className="mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Markdown Editor</h1>
        <div className="inline-flex rounded-lg border border-border p-1">
          {(["md-to-html", "html-to-md"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                mode === m ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              {m === "md-to-html" ? "Markdown → HTML" : "HTML → Markdown"}
            </button>
          ))}
        </div>
      </div>

      {mode === "md-to-html" ? (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Markdown Source</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMarkdown("")}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                title="Clear"
              >
                Clear
              </button>
              <button
                onClick={() => copyText(markdown, "markdown")}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                title="Copy markdown"
              >
                {copied === "markdown" ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => downloadFile(markdown, "document.md", "text/markdown")}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                title="Download .md"
              >
                Download
              </button>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Loading editor…
              </div>
            }
          >
            <div data-color-mode={resolvedTheme}>
              <MDEditor
                value={markdown}
                onChange={(value) => setMarkdown(value ?? "")}
                enableScroll={true}
                height={500}
                textareaProps={{
                  placeholder: "Please write your markdown here",
                }}
              />
            </div>
          </Suspense>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <h2 className="text-sm font-medium text-muted-foreground">HTML Output</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => copyRichHtml(html)}
                disabled={!html}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                title="Copy as formatted HTML (pastes styled into Docs, Gmail, Word, etc.)"
              >
                {copied === "html" ? "Copied" : "Copy as HTML"}
              </button>
              <button
                onClick={() => copyText(html, "htmlSource")}
                disabled={!html}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                title="Copy raw HTML markup"
              >
                {copied === "htmlSource" ? "Copied" : "Copy HTML Source"}
              </button>
              <button
                onClick={() => downloadFile(html, "document.html", "text/html")}
                disabled={!html}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                title="Download .html"
              >
                Download
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={html}
            placeholder="HTML output will appear here"
            className="h-64 w-full resize-y rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs text-foreground"
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-muted-foreground">HTML Source</h2>
                <button
                  onClick={() => setHtmlInput("")}
                  className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  title="Clear"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="Paste HTML here"
                className="h-[500px] w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">Markdown Output</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => copyText(convertedMarkdown, "convertedMarkdown")}
                    disabled={!convertedMarkdown}
                    className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                    title="Copy markdown"
                  >
                    {copied === "convertedMarkdown" ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => downloadFile(convertedMarkdown, "document.md", "text/markdown")}
                    disabled={!convertedMarkdown}
                    className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                    title="Download .md"
                  >
                    Download
                  </button>
                  <button
                    onClick={openConvertedMarkdownInEditor}
                    disabled={!convertedMarkdown}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                    title="Open in the Markdown editor"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={convertedMarkdown}
                placeholder="Markdown output will appear here"
                className="h-[500px] w-full resize-y rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs text-foreground"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RouteComponent;
