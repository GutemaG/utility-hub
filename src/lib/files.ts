import { zipSync } from "fflate";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Give the browser a moment to start the download before releasing the blob
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBytes(bytes: Uint8Array, fileName: string, mime: string) {
  downloadBlob(new Blob([bytes as BlobPart], { type: mime }), fileName);
}

// Bundle several files into one .zip download, renaming duplicates as "name (2).ext"
export async function downloadZip(files: { name: string; data: Blob | Uint8Array }[], zipName: string) {
  const entries: Record<string, Uint8Array> = {};
  for (const file of files) {
    const data = file.data instanceof Blob ? new Uint8Array(await file.data.arrayBuffer()) : file.data;
    entries[uniqueName(file.name, entries)] = data;
  }
  downloadBytes(zipSync(entries, { level: 0 }), zipName, "application/zip");
}

function uniqueName(name: string, taken: Record<string, unknown>) {
  if (!(name in taken)) return name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let i = 2;
  while (`${base} (${i})${ext}` in taken) i++;
  return `${base} (${i})${ext}`;
}

export function baseName(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}
