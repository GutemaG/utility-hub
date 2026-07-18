import React, { useState, type DragEvent } from "react";

export const FileDropzone: React.FC<{
  onFileDrop: (file: File) => void;
  isProcessing: boolean;
}> = ({ onFileDrop, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileDrop(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileDrop(files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-300
        ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-border bg-muted/40"}
        ${isProcessing ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-ring"}`}
    >
      <input
        type="file"
        id="fileUpload"
        className="hidden"
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        disabled={isProcessing}
      />
      <label
        htmlFor="fileUpload"
        className="flex flex-col items-center justify-center space-y-2 cursor-pointer"
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-muted-foreground">
          {isProcessing ? (
            "Processing..."
          ) : (
            <>
              <span className="font-semibold text-primary">
                Click to upload
              </span>{" "}
              or drag and drop
            </>
          )}
        </p>
            <p className="text-xs text-muted-foreground">Excel files only (.xlsx, .xls)</p>
      </label>
    </div>
  );
};
