"use client";

import html2canvas from "html2canvas-pro";
import {
  Download,
  Expand,
  ExternalLink,
  Link as LinkIcon,
  Pencil,
  Share,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { deleteMonster } from "@/app/actions/monster";
import { VisibilityBadge } from "@/app/ui/VisibilityBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Monster } from "@/lib/types";

interface MonsterCardActionsProps {
  monster: Monster;
  isOwner?: boolean;
}

export default function CardActions({
  monster,
  isOwner,
}: MonsterCardActionsProps) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const isOnDetailPage = pathname === `/m/${monster.id}`;

  const copyMonsterLink = async () => {
    try {
      const url = `${window.location.origin}/m/${monster.id}`;
      await navigator.clipboard.writeText(url);
      const activeElement = document.activeElement as HTMLElement;
      activeElement?.blur?.();
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const downloadCard = async () => {
    try {
      const cardElement = document.querySelector(
        `#monster-${monster.id} > div`
      );
      if (!cardElement) return;

      // Store original style
      const exportAttribution = cardElement.querySelector(
        ".export-attribution"
      );
      let originalAttributionDisplay = "";

      if (exportAttribution) {
        originalAttributionDisplay = (exportAttribution as HTMLElement).style
          .display;
        (exportAttribution as HTMLElement).style.display = "block";
      }

      try {
        // Create a wrapper with padding to handle the overflow
        const wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.left = "-9999px";
        wrapper.style.top = "0";
        wrapper.style.padding = "1.5rem 1.5rem 0 1.5rem"; // Padding on sides and top only
        document.body.appendChild(wrapper);

        const cardClone = cardElement.cloneNode(true) as HTMLElement;

        // Remove action buttons from clone before capture (keep attribution)
        const actionsDiv = cardClone.querySelector(".d-card-actions");
        if (actionsDiv) {
          actionsDiv.parentNode?.removeChild(actionsDiv);
        }

        // Replace shadcn separators with simple HR elements to ensure they show up in the image
        const separators = cardClone.querySelectorAll(
          '[data-slot="separator"]'
        );
        for (const separator of separators) {
          const hr = document.createElement("hr");
          hr.style.width = "100%";
          hr.style.margin = "0.25rem 0";
          hr.style.border = "none";
          hr.style.borderTop = "1px solid #d1d5db";
          hr.style.height = "1px";
          separator.parentNode?.replaceChild(hr, separator);
        }

        // Fix vertical spacing in card
        const abilities = cardClone.querySelectorAll(".abilities");
        for (const ability of abilities) {
          (ability as HTMLElement).style.gap = "0.5rem";
        }
        const ps = cardClone.querySelectorAll("p");
        for (const p of ps) {
          (p as HTMLElement).style.margin = "0.25rem 0";
        }

        cardClone.style.paddingBottom = "0.75rem";

        wrapper.appendChild(cardClone);

        const originalCard = document.querySelector(
          `#monster-${monster.id} > div`
        ) as HTMLElement;
        const originalWidth = originalCard.offsetWidth;
        cardClone.style.width = `${originalWidth}px`;

        const canvas = await html2canvas(wrapper, {
          scale: 2,
          backgroundColor: "#ffffff", // White background
          useCORS: true,
          allowTaint: true,
          imageTimeout: 0,
          logging: true,
        });

        document.body.removeChild(wrapper);

        const link = document.createElement("a");
        link.download = `${monster.name}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } finally {
        if (exportAttribution) {
          (exportAttribution as HTMLElement).style.display =
            originalAttributionDisplay;
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  return (
    <div className="flex gap-2">
      {isOwner && (
        <div className="mr-2">
          <VisibilityBadge visibility={monster.visibility} />
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="hover:opacity-70">
          <Share className="w-5 h-5 text-base-content/50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="min-w-38">
          {!isOnDetailPage && (
            <DropdownMenuItem asChild>
              <Link
                className="flex gap-2 items-center"
                href={`/m/${monster.id}`}
              >
                <Expand className="w-4 h-4" />
                Monster Detail
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <a
              className="flex gap-2 items-center"
              href={`http://nimbrew.net/${monster.legendary ? "statblock-legendary" : "statblock-generic"}?urlJson=https://nimble.monster/m/${monster.id}/nimbrew.json`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Send to Nimbrew
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyMonsterLink}>
            <LinkIcon className="w-4 h-4" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadCard}>
            <Download className="w-4 h-4" />
            Card Image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
