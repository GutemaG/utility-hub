import { RawImage, pipeline } from "@huggingface/transformers";

// ORMBG (Open Remove Background Model, Apache-2.0), 8-bit quantized: ~44 MB, cached by the browser after the first download.
const MODEL = "onnx-community/ormbg-ONNX";

export type WorkerRequest = { id: number; blob: Blob };
export type WorkerResponse =
  | { type: "progress"; loaded: number; total: number }
  | { type: "ready" }
  | { type: "result"; id: number; width: number; height: number; mask: Uint8Array }
  | { type: "error"; id: number; message: string };

type Segmenter = (image: RawImage) => Promise<RawImage>;

let segmenter: Promise<Segmenter> | null = null;

function load(): Promise<Segmenter> {
  segmenter ??= pipeline("background-removal", MODEL, {
    dtype: "q8",
    device: "wasm",
    progress_callback: (info: { status: string; loaded?: number; total?: number }) => {
      if (info.status === "progress_total" && info.total) {
        postMessage({ type: "progress", loaded: info.loaded ?? 0, total: info.total } satisfies WorkerResponse);
      }
    },
  }).then((p) => {
    postMessage({ type: "ready" } satisfies WorkerResponse);
    return p as unknown as Segmenter;
  });
  segmenter.catch(() => (segmenter = null));
  return segmenter;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, blob } = event.data;
  try {
    const run = await load();
    const image = await RawImage.fromBlob(blob);
    const out = await run(image);
    // Send back only the alpha channel; the page composites it with the original pixels.
    const { width, height, data, channels } = out;
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < mask.length; i++) mask[i] = data[i * channels + channels - 1];
    postMessage({ type: "result", id, width, height, mask } satisfies WorkerResponse, { transfer: [mask.buffer] });
  } catch (err) {
    postMessage({ type: "error", id, message: err instanceof Error ? err.message : String(err) } satisfies WorkerResponse);
  }
};
