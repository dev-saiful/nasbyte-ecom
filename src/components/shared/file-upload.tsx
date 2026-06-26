"use client";

import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  label?: string;
}

export function FileUpload({
  value,
  onChange,
  folder = "nasbyte/uploads",
  accept = "image/jpeg,image/png,image/webp",
  label = "Upload file",
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const result = await response.json();
        onChange(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [folder, onChange],
  );

  const handleRemove = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative h-32 w-32 inline-block rounded-md border">
          <Image
            src={value}
            alt="Uploaded"
            fill
            sizes="128px"
            className="object-cover rounded-md"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-4 transition-colors hover:bg-muted">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <span className="mt-2 text-sm text-muted-foreground">
            {isUploading ? "Uploading..." : label}
          </span>
          <input
            type="file"
            accept={accept}
            onChange={handleUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
