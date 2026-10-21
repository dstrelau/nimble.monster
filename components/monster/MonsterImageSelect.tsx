"use client";

import { ImagePlus, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Link } from "@/components/layout/Link";
import { MonsterImage } from "@/components/monster/MonsterImage";
import {
  PaperforgeImageChoices,
  PaperforgeImageSelect,
} from "@/components/paperforge/PaperforgeImageSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureFlag } from "@/lib/contexts/FeatureFlagsContext";
import {
  MONSTER_ARTWORK_ACCEPT,
  MONSTER_ARTWORK_MAX_FILE_SIZE,
  type MonsterArtwork,
  monsterArtworkSchema,
} from "@/lib/monster-artwork";
import { cn } from "@/lib/utils";

interface MonsterImageSelection {
  paperforgeId?: string;
  customArtwork: MonsterArtwork | null;
}

interface MonsterImageSelectProps {
  value?: string;
  customArtwork?: MonsterArtwork | null;
  onChange: (selection: MonsterImageSelection) => void;
  className?: string;
  portrait?: boolean;
}

export function MonsterImageSelect({
  value,
  customArtwork,
  onChange,
  className,
  portrait = false,
}: MonsterImageSelectProps) {
  const enabled = useFeatureFlag("monster-custom-artwork");
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const pendingUploads = useRef<MonsterArtwork[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MonsterArtwork | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discardUploads = (keepId?: string) => {
    for (const artwork of pendingUploads.current) {
      if (artwork.id !== keepId) {
        void fetch("/_actions/deleteMonsterArtwork", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: artwork.id }),
        }).catch(() => undefined);
      }
    }
    pendingUploads.current = [];
  };

  const changeOpen = (next: boolean) => {
    if (isUploading) return;
    if (next) {
      setDraft(customArtwork ?? null);
      setError(null);
    } else {
      discardUploads();
    }
    setOpen(next);
  };

  const choose = (selection: MonsterImageSelection) => {
    discardUploads(selection.customArtwork?.id);
    onChange(selection);
    setOpen(false);
  };

  const upload = async (file?: File) => {
    if (!file || isUploading || !enabled) return;
    setError(null);
    if (file.size > MONSTER_ARTWORK_MAX_FILE_SIZE) {
      setError("Images must be 10 MB or smaller");
      return;
    }
    if (file.type && !MONSTER_ARTWORK_ACCEPT.split(",").includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are supported");
      return;
    }
    setIsUploading(true);
    try {
      const body = new FormData();
      body.set("image", file);
      const response = await fetch("/_actions/uploadMonsterArtwork", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Could not upload artwork"
        );
      }
      const artwork = monsterArtworkSchema.parse(result);
      pendingUploads.current.push(artwork);
      setDraft({
        ...artwork,
        artist: draft?.artist,
        sourceUrl: draft?.sourceUrl,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not upload artwork"
      );
    } finally {
      setIsUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  if (!enabled && !customArtwork) {
    return (
      <PaperforgeImageSelect
        value={value}
        onChange={(paperforgeId) =>
          onChange({ paperforgeId, customArtwork: null })
        }
        portrait={portrait}
        className={className}
      />
    );
  }

  return (
    <div className={cn(!portrait && "space-y-2", className)}>
      {!portrait && <Label htmlFor={`${id}-choose`}>Image</Label>}
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogTrigger asChild>
          <Button
            id={`${id}-choose`}
            type="button"
            variant={portrait ? "ghost" : "outline"}
            aria-label={
              value || customArtwork ? "Change image" : "Choose image"
            }
            className={cn(
              portrait
                ? "group relative size-22 rounded-full p-0 whitespace-normal"
                : "w-fit",
              portrait &&
                !value &&
                !customArtwork &&
                "border-2 border-dashed border-input bg-muted text-xs text-muted-foreground"
            )}
          >
            {portrait && (value || customArtwork) ? (
              <>
                <MonsterImage
                  paperforgeId={value}
                  customArtwork={customArtwork}
                  size={88}
                  className="size-full"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-neutral-600/80 px-3 text-center text-xs text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                  Change image
                </span>
              </>
            ) : (
              <>
                {!portrait && <ImagePlus />}
                {value || customArtwork ? "Change image" : "Choose image"}
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent
          className="flex max-h-[90dvh] flex-col"
          aria-describedby={undefined}
          onInteractOutside={(event) => {
            if (isUploading) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Choose image</DialogTitle>
          </DialogHeader>
          <Tabs
            defaultValue={customArtwork ? "upload" : "paperforge"}
            className="min-h-0 flex-1"
          >
            <TabsList className="mx-auto">
              <TabsTrigger value="paperforge" disabled={isUploading}>
                Paper Forge
              </TabsTrigger>
              <TabsTrigger value="upload" disabled={isUploading}>
                Upload
              </TabsTrigger>
            </TabsList>
            <TabsContent value="paperforge" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Images by{" "}
                <Link href="https://www.patreon.com/c/paperforge">
                  Paper Forge
                </Link>
                . For personal use only.
              </p>
              <PaperforgeImageChoices
                value={value}
                portrait
                onChange={(paperforgeId) =>
                  choose({ paperforgeId, customArtwork: null })
                }
              />
            </TabsContent>
            <TabsContent value="upload" className="space-y-4 overflow-y-auto">
              {draft && (
                <MonsterImage
                  customArtwork={draft}
                  size={160}
                  className="mx-auto size-40"
                  alt="Artwork preview"
                />
              )}
              {enabled ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`${id}-file`}>Image file</Label>
                    <Input
                      ref={input}
                      id={`${id}-file`}
                      type="file"
                      accept={MONSTER_ARTWORK_ACCEPT}
                      disabled={isUploading}
                      onChange={(event) => void upload(event.target.files?.[0])}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isUploading
                        ? "Uploading artwork…"
                        : "JPEG, PNG, or WebP up to 10 MB"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only upload artwork you have permission to use. Uploaded
                    files are accessible to anyone with the image URL, including
                    artwork for private monsters.
                  </p>
                  {draft && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`${id}-artist`}>
                          Artist (optional)
                        </Label>
                        <Input
                          id={`${id}-artist`}
                          maxLength={200}
                          value={draft.artist ?? ""}
                          disabled={isUploading}
                          onChange={(event) =>
                            setDraft({ ...draft, artist: event.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${id}-source`}>
                          Source URL (optional)
                        </Label>
                        <Input
                          id={`${id}-source`}
                          type="url"
                          value={draft.sourceUrl ?? ""}
                          disabled={isUploading}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              sourceUrl: event.target.value,
                            })
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={isUploading}
                        onClick={() => {
                          const parsed = monsterArtworkSchema.safeParse({
                            ...draft,
                            artist: draft.artist?.trim() || undefined,
                            sourceUrl: draft.sourceUrl?.trim() || undefined,
                          });
                          if (!parsed.success) {
                            setError(
                              parsed.error.issues[0]?.message ??
                                "Invalid artwork credit"
                            );
                            return;
                          }
                          choose({ customArtwork: parsed.data });
                        }}
                      >
                        Use image
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Custom artwork uploads are not enabled for your account. You
                  can keep or remove the current image.
                </p>
              )}
            </TabsContent>
          </Tabs>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isUploading || (!value && !customArtwork)}
              onClick={() => choose({ customArtwork: null })}
            >
              <X />
              Remove image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
