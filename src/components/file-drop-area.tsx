import { useEffect, useId, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";

import { cn } from "@/lib/utils";

// Drag-and-drop / click / paste file picker. Unlike FileDropzone (Excel only), this one is
// configurable and can hand back several files at once.
export function FileDropArea({
  onFiles,
  accept,
  multiple = false,
  hint,
  disabled = false,
  listenToPaste = false,
  className,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  hint?: string;
  disabled?: boolean;
  // Also accept files pasted anywhere on the page (e.g. a screenshot from the clipboard)
  listenToPaste?: boolean;
  className?: string;
}) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  const accepts = (file: File) => {
    if (!accept) return true;
    return accept.split(",").some((rule) => {
      const r = rule.trim().toLowerCase();
      if (r.startsWith(".")) return file.name.toLowerCase().endsWith(r);
      if (r.endsWith("/*")) return file.type.startsWith(r.slice(0, -1));
      return file.type === r;
    });
  };

  const handleFiles = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = Array.from(list).filter(accepts);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  useEffect(() => {
    if (!listenToPaste || disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      if (e.clipboardData?.files.length) {
        e.preventDefault();
        handleFiles(e.clipboardData.files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const stop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <label
      htmlFor={inputId}
      onDragEnter={(e) => {
        stop(e);
        if (!disabled) setIsDragging(true);
      }}
      onDragOver={stop}
      onDragLeave={(e) => {
        stop(e);
        setIsDragging(false);
      }}
      onDrop={(e) => {
        stop(e);
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
        isDragging ? "border-blue-500 bg-blue-500/10" : "border-border bg-muted/40",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-ring",
        className
      )}
    >
      <input
        id={inputId}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Upload className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
        {listenToPaste ? ", or paste" : ""}
      </p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </label>
  );
}

export default FileDropArea;
