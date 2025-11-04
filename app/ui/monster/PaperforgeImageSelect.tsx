import { Check, ChevronsUpDown, Info } from "lucide-react";
import { useState } from "react";
import { Link } from "@/components/app/Link";
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
}> = ({ value, onChange, className }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { value: "", label: "None" },
    ...PAPERFORGE_ENTRIES.map((e: PaperForgeEntry) => ({
      value: e.id,
      label: `${e.name} (#${e.id})`,
    })),
  ];

  const selectedLabel =
    options.find((opt) => opt.value === (value || ""))?.label || "None";

  // https://github.com/dstrelau/nimble.monster/blob/main/data/paperforge.csv
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
                  <p>
                    {" "}
                    Don't see what you're looking for? Submit a Pull Request to
                    update{" "}
                    <Link href="https://github.com/dstrelau/nimble.monster/blob/main/data/paperforge.csv">
                      this CSV file
                    </Link>
                    .
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedLabel}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No image found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={(v) => {
                      onChange(v === "None" ? undefined : option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        (value || "") === option.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
