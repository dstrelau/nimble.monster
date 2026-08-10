"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ADVENTURE_IMAGE_ACCEPT,
  ADVENTURE_IMAGE_MAX_FILE_SIZE,
  type AdventureImageAsset,
} from "@/lib/adventure-images";
import { cn } from "@/lib/utils";

interface AdventureImageUploadProps {
  image: AdventureImageAsset | null;
  onChange: (image: AdventureImageAsset | null) => void;
}

export function AdventureImageUpload({
  image,
  onChange,
}: AdventureImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > ADVENTURE_IMAGE_MAX_FILE_SIZE) {
      setError("Images must be 10 MB or smaller");
      return;
    }
    if (!ADVENTURE_IMAGE_ACCEPT.split(",").includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are supported");
      return;
    }

    setIsUploading(true);
    try {
      const body = new FormData();
      body.set("image", file);
      const response = await fetch("/_actions/uploadAdventureImage", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Could not upload image"
        );
      }
      onChange(result);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload image"
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (image) {
    return (
      <div className="space-y-3 rounded-lg border p-3">
        {/* biome-ignore lint/performance/noImgElement: This is an already pre-sized upload thumbnail. */}
        <img
          src={image.thumbnailUrl}
          alt="Uploaded adventure map preview"
          className="mx-auto max-h-64 rounded-md object-contain"
        />
        <Button type="button" variant="outline" onClick={() => onChange(null)}>
          <Trash2 />
          Remove image
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <fieldset
        className={cn(
          "flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center text-muted-foreground transition-colors",
          isDragging && "border-primary bg-primary/5"
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void upload(event.dataTransfer.files[0]);
        }}
      >
        <legend className="sr-only">Adventure image upload</legend>
        <ImagePlus className="size-8" aria-hidden="true" />
        <p>
          {isUploading ? "Uploading image…" : "Drop image to upload or"}{" "}
          {!isUploading && (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 align-baseline"
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
          )}
        </p>
        <p className="text-xs">JPEG, PNG, or WebP up to 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={ADVENTURE_IMAGE_ACCEPT}
          className="sr-only"
          disabled={isUploading}
          aria-label="Choose adventure image"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
      </fieldset>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
