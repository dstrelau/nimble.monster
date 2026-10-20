import { ChevronsUpDown, Info, X } from "lucide-react";
import { useState } from "react";
import { Link } from "@/components/layout/Link";
import {
  getPaperforgeImageUrl,
  PaperforgeImage,
} from "@/components/paperforge/PaperforgeImage";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PAPERFORGE_ENTRIES,
  type PaperForgeEntry,
} from "@/lib/paperforge-catalog";
import { cn } from "@/lib/utils";

export const PaperforgeImageSelect: React.FC<{
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  className?: string;
  portrait?: boolean;
}> = ({ value, onChange, className, portrait = false }) => {
  const [open, setOpen] = useState(false);

  const options = PAPERFORGE_ENTRIES.map((e: PaperForgeEntry) => ({
    value: e.id,
    label: `${e.name} (#${e.id})`,
    name: e.name,
    folder: e.folder,
  })).sort((a, b) => a.label.localeCompare(b.label));

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "Select image...";

  const imageChoices = (
    <Command label={portrait ? "Search images" : undefined}>
      <CommandInput placeholder="Search..." autoFocus={portrait} />
      <CommandList
        className={cn(
          portrait ? "max-h-[min(50dvh,32rem)]" : "max-h-[min(65vh,32rem)]"
        )}
      >
        <CommandEmpty>No image found.</CommandEmpty>
        <CommandGroup className="p-0 [&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-3">
          {options.map((option) => (
            <CommandItem
              key={option.value}
              value={option.label}
              className="group min-w-0 flex-col gap-0.5 py-0.5 text-center data-[selected=true]:bg-transparent"
              onSelect={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <div className="flex items-center justify-center rounded-sm">
                {/* biome-ignore lint/performance/noImgElement: Using pre-sized Tigris images */}
                <img
                  src={getPaperforgeImageUrl(option.folder, 50)}
                  srcSet={`${getPaperforgeImageUrl(option.folder, 50)} 1x, ${getPaperforgeImageUrl(option.folder, 100)} 2x`}
                  alt=""
                  width={50}
                  height={50}
                  loading="lazy"
                  className={cn(
                    "size-[50px] rounded-full object-contain transition-[filter] duration-150 group-hover:drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]",
                    value === option.value &&
                      "bg-accent ring-2 ring-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                  )}
                />
              </div>
              <span
                className={cn(
                  "line-clamp-2 w-full text-xs leading-4",
                  value === option.value && "font-bold"
                )}
              >
                {option.name}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (portrait) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              value
                ? `Change image. Current selection: ${selectedLabel}`
                : "Choose image"
            }
            className={cn(
              "group relative size-22 rounded-full p-0 whitespace-normal",
              !value &&
                "border-2 border-dashed border-input bg-muted text-xs font-medium text-muted-foreground",
              className
            )}
          >
            {value ? (
              <>
                <PaperforgeImage
                  id={value}
                  size={88}
                  className="size-full object-contain"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-neutral-600/80 px-3 text-center text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                  Change image
                </span>
              </>
            ) : (
              <span className="px-3 text-center">Choose image</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{value ? "Change image" : "Choose image"}</DialogTitle>
            <DialogDescription>
              Images by{" "}
              <Link href="https://www.patreon.com/c/paperforge">
                Paper Forge
              </Link>
              . For personal use only.
            </DialogDescription>
          </DialogHeader>
          {imageChoices}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={!value}
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              <X /> Clear image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="gap-1" htmlFor="image">
        Image
        <Dialog>
          <DialogTrigger>
            <Info className="cursor-pointer size-4" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Paper Forge Images</DialogTitle>
              <DialogDescription asChild className="space-y-4">
                <div>
                  <p>
                    The fine folks at{" "}
                    <Link href="https://www.patreon.com/c/paperforge">
                      Paper Forge
                    </Link>{" "}
                    have allowed use of their free images for personal use only.
                    Consider supporting them on Patreon for full access to their
                    paper miniatures and VTT tokens!
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-label={`Select image. Current selection: ${selectedLabel}`}
              aria-expanded={open}
              className="min-w-0 basis-32 grow shrink justify-between"
            >
              <span className="truncate">{selectedLabel}</span>
              <ChevronsUpDown className="shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            collisionPadding={12}
            className="w-[min(26rem,calc(100vw-2rem))] p-0"
          >
            {imageChoices}
          </PopoverContent>
        </Popover>
        {value && (
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => onChange(undefined)}
          >
            <X />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};
