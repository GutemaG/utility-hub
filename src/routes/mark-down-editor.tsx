import { Suspense, lazy, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSEO } from "@/hooks/use-seo";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

export const Route = createFileRoute("/mark-down-editor")({
  component: RouteComponent,
});

function RouteComponent() {
  const [markdown, setMarkdown] = useState("**Hello**");

  useSEO({
    title: "Markdown Editor | Utility Hub",
    description:
      "Write Markdown with live preview, scroll sync, and quick copy/download. Supports GitHub-Flavored Markdown.",
    path: "/mark-down-editor",
    keywords: "markdown editor, live preview, GFM, scroll sync, utility-hub",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "Live preview",
      "Scroll sync",
      "GitHub-Flavored Markdown",
      "Copy and download .md",
    ],
  });

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

      <Suspense fallback={<div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">Loading editor…</div>}>
        <MDEditor
          value={markdown}
          onChange={(value) => setMarkdown(value ?? "")}
          enableScroll={true}
          height={600}
          textareaProps={{
            placeholder: "Please write your markdown here",
          }}
        />
      </Suspense>
    </div>
  );
}

export default RouteComponent;
