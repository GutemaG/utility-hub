import { unzlibSync } from "fflate";
import type { PDFDocument as PDFDocumentType, PDFObject, PDFRawStream as PDFRawStreamType } from "pdf-lib";

import { renderPdfPages } from "@/lib/pdfjs";

export type CompressLevel = "low" | "medium" | "high";

// Longest side (px) and JPEG quality used when re-encoding images, per level
const IMAGE_SETTINGS: Record<CompressLevel, { maxSide: number; quality: number }> = {
  low: { maxSide: 2400, quality: 0.82 },
  medium: { maxSide: 1600, quality: 0.7 },
  high: { maxSide: 1100, quality: 0.55 },
};

// Resolution and JPEG quality for the "scan" mode that turns every page into one picture
const RASTER_SETTINGS: Record<CompressLevel, { dpi: number; quality: number }> = {
  low: { dpi: 150, quality: 0.75 },
  medium: { dpi: 110, quality: 0.6 },
  high: { dpi: 80, quality: 0.45 },
};

type Progress = (done: number, total: number) => void;

/**
 * Shrink the images inside a PDF and keep everything else (text stays selectable and searchable).
 * Each photo is downscaled and saved as a JPEG, but only when that makes it smaller.
 */
export async function compressPdfImages(bytes: Uint8Array, level: CompressLevel, onProgress?: Progress) {
  const { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFArray, PDFDict } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const { maxSide, quality } = IMAGE_SETTINGS[level];

  const images = doc.context
    .enumerateIndirectObjects()
    .filter(([, obj]) => obj instanceof PDFRawStream && obj.dict.get(PDFName.of("Subtype")) === PDFName.of("Image"));

  let replaced = 0;
  for (let i = 0; i < images.length; i++) {
    onProgress?.(i, images.length);
    const [ref, obj] = images[i] as [Parameters<typeof doc.context.assign>[0], PDFRawStreamType];
    const dict = obj.dict;
    const num = (key: string) => {
      const v = dict.get(PDFName.of(key));
      return v instanceof PDFNumber ? v.asNumber() : undefined;
    };
    const width = num("Width") ?? 0;
    const height = num("Height") ?? 0;
    const bits = num("BitsPerComponent");
    // Masks, odd bit depths and tiny images aren't worth touching
    if (dict.get(PDFName.of("ImageMask")) || dict.get(PDFName.of("Decode")) || width * height < 128 * 128) continue;
    if (obj.contents.length < 20 * 1024) continue;

    const filterObj = dict.get(PDFName.of("Filter"));
    const filters = filterObj instanceof PDFArray ? filterObj.asArray() : filterObj ? [filterObj] : [];
    const filter = filters.length === 1 ? filters[0].toString() : filters.length === 0 ? "" : "multiple";
    const channels = colorChannels(doc, dict.get(PDFName.of("ColorSpace")), { PDFName, PDFArray, PDFRawStream, PDFDict, PDFNumber });
    if (!channels) continue;

    let source: ImageBitmap | ImageData | null = null;
    try {
      if (filter === "/DCTDecode" && channels !== 4) {
        source = await createImageBitmap(new Blob([obj.contents as BlobPart], { type: "image/jpeg" }));
      } else if ((filter === "/FlateDecode" || filter === "") && bits === 8 && channels !== 4) {
        const raw = filter ? unzlibSync(obj.contents) : obj.contents;
        const parms = dict.get(PDFName.of("DecodeParms"));
        const pred = parms instanceof PDFDict ? parms.get(PDFName.of("Predictor")) : undefined;
        const predictor = pred instanceof PDFNumber ? pred.asNumber() : 1;
        if (predictor !== 1 && predictor < 10) continue; // TIFF predictor: rare, skip
        const pixels = predictor >= 10 ? unPng(raw, width, height, channels) : raw;
        if (pixels.length < width * height * channels) continue;
        source = toImageData(pixels, width, height, channels);
      } else {
        continue;
      }
    } catch {
      continue; // an image the browser can't decode stays as it is
    }

    const scale = Math.min(1, maxSide / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    if (source instanceof ImageData) {
      const tmp = document.createElement("canvas");
      tmp.width = width;
      tmp.height = height;
      tmp.getContext("2d")!.putImageData(source, 0, 0);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(tmp, 0, 0, w, h);
    } else {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, w, h);
      source.close();
    }
    const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!jpeg) continue;
    const jpegBytes = new Uint8Array(await jpeg.arrayBuffer());
    if (jpegBytes.length >= obj.contents.length * 0.9) continue; // not worth it

    // canvas always writes colour JPEGs, so grey images come back as RGB (still much smaller)
    const next = doc.context.stream(jpegBytes, {
      Type: "XObject",
      Subtype: "Image",
      Width: w,
      Height: h,
      ColorSpace: "DeviceRGB",
      BitsPerComponent: 8,
      Filter: "DCTDecode",
    });
    // Keep the transparency mask and other display hints
    for (const key of ["SMask", "Mask", "Interpolate", "Intent"]) {
      const v = dict.get(PDFName.of(key));
      if (v) next.dict.set(PDFName.of(key), v);
    }
    doc.context.assign(ref, next);
    replaced++;
  }
  onProgress?.(images.length, images.length);

  const out = await doc.save({ useObjectStreams: true });
  return { bytes: out, images: images.length, replaced };
}

/** Turn every page into a JPEG and rebuild the PDF from those pictures. Smallest result, but text is no longer selectable. */
export async function compressPdfAsImages(file: Blob, level: CompressLevel, onProgress?: Progress) {
  const { PDFDocument } = await import("pdf-lib");
  const { dpi, quality } = RASTER_SETTINGS[level];
  const scale = dpi / 72;
  const out = await PDFDocument.create();
  for await (const { canvas, pageNumber, pageCount } of renderPdfPages(file, scale)) {
    onProgress?.(pageNumber - 1, pageCount);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob) throw new Error(`Could not convert page ${pageNumber}.`);
    const image = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    const width = canvas.width / scale;
    const height = canvas.height / scale;
    out.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
    canvas.width = canvas.height = 0;
    onProgress?.(pageNumber, pageCount);
  }
  return out.save({ useObjectStreams: true });
}

type PdfLibCtors = {
  PDFName: typeof import("pdf-lib").PDFName;
  PDFArray: typeof import("pdf-lib").PDFArray;
  PDFRawStream: typeof import("pdf-lib").PDFRawStream;
  PDFDict: typeof import("pdf-lib").PDFDict;
  PDFNumber: typeof import("pdf-lib").PDFNumber;
};

/** Number of colour channels for the colour spaces we can safely re-encode (gray, RGB, CMYK), or null. */
function colorChannels(doc: PDFDocumentType, cs: unknown, L: PdfLibCtors): number | null {
  const resolved = cs ? doc.context.lookup(cs as PDFObject) : undefined;
  if (resolved instanceof L.PDFName) {
    const n = resolved.toString();
    return n === "/DeviceRGB" ? 3 : n === "/DeviceGray" ? 1 : n === "/DeviceCMYK" ? 4 : null;
  }
  if (resolved instanceof L.PDFArray && resolved.size() === 2 && resolved.get(0).toString() === "/ICCBased") {
    const profile = doc.context.lookup(resolved.get(1));
    const n = profile instanceof L.PDFRawStream || profile instanceof L.PDFDict ? (profile instanceof L.PDFDict ? profile : profile.dict).get(L.PDFName.of("N")) : null;
    const v = n instanceof L.PDFNumber ? n.asNumber() : null;
    return v === 1 || v === 3 || v === 4 ? v : null;
  }
  return null; // Indexed, Lab, Separation, ... stay untouched
}

/** Undo PNG row filters (PDF Predictor ≥ 10). */
function unPng(data: Uint8Array, width: number, height: number, channels: number) {
  const stride = width * channels;
  const out = new Uint8Array(stride * height);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const type = data[src++];
    const row = y * stride;
    const prev = row - stride;
    for (let x = 0; x < stride; x++) {
      const raw = data[src++];
      const a = x >= channels ? out[row + x - channels] : 0;
      const b = y > 0 ? out[prev + x] : 0;
      const c = y > 0 && x >= channels ? out[prev + x - channels] : 0;
      let v = raw;
      if (type === 1) v = raw + a;
      else if (type === 2) v = raw + b;
      else if (type === 3) v = raw + ((a + b) >> 1);
      else if (type === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v = raw + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[row + x] = v & 0xff;
    }
  }
  return out;
}

function toImageData(pixels: Uint8Array, width: number, height: number, channels: number) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += channels) {
    const o = i * 4;
    if (channels === 1) {
      rgba[o] = rgba[o + 1] = rgba[o + 2] = pixels[j];
    } else {
      rgba[o] = pixels[j];
      rgba[o + 1] = pixels[j + 1];
      rgba[o + 2] = pixels[j + 2];
    }
    rgba[o + 3] = 255;
  }
  return new ImageData(rgba, width, height);
}
