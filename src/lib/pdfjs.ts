import type * as PdfJs from "pdfjs-dist";

let pdfjsPromise: Promise<typeof PdfJs> | null = null;

/** Load pdf.js (and point it at its bundled worker) on first use. */
export function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]).then(
      ([pdfjs, worker]) => {
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        return pdfjs;
      }
    );
  }
  return pdfjsPromise;
}

/** Render the pages of a PDF (all, or only `only`, 1-based) to canvases at the given scale (1 = 72 DPI). */
export async function* renderPdfPages(file: Blob, scale: number, only?: Set<number>) {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      if (only && !only.has(n)) continue;
      const page = await doc.getPage(n);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      page.cleanup();
      yield { canvas, pageNumber: n, pageCount: doc.numPages };
    }
  } finally {
    void doc.destroy();
  }
}
