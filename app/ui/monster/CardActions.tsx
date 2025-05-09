"use client";

import React, { useTransition } from "react";
import {
  Download,
  Link as LinkIcon,
  Pencil,
  Trash,
  Share,
  Expand,
} from "lucide-react";
import Link from "next/link";
import { deleteMonster } from "@/actions/monster";
import html2canvas from "html2canvas-pro";
import type { Monster } from "@/lib/types";
import { Dropdown } from "@/ui/components/dropdown";

interface MonsterCardActionsProps {
  monster: Monster;
  showActions?: boolean;
}

export default function CardActions({
  monster,
  showActions,
}: MonsterCardActionsProps) {
  const [isPending, startTransition] = useTransition();

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
        `#monster-${monster.id} article`,
      );
      if (!cardElement) return;

      // Store original style
      const exportAttribution = cardElement.querySelector(
        ".export-attribution",
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

        // Remove action buttons from clone before capture
        const actionsDiv = cardClone.querySelector(".d-card-actions");
        if (actionsDiv) {
          actionsDiv.parentNode?.removeChild(actionsDiv);
        }

        // Replace dividers with simple HR elements to ensure they show up in the image
        const dividers = cardClone.querySelectorAll(".d-divider");
        dividers.forEach((divider) => {
          const hr = document.createElement("hr");
          hr.style.width = "100%";
          hr.style.margin = "0.25rem 0";
          hr.style.border = "none";
          hr.style.borderTop = "1px solid #e5e7eb";
          hr.style.height = "1px";
          divider.parentNode?.replaceChild(hr, divider);
        });

        // Fix vertical spacing in card
        const abilities = cardClone.querySelectorAll(".abilities");
        abilities.forEach((a) => {
          (a as HTMLElement).style.gap = "0.5rem";
        });
        const ps = cardClone.querySelectorAll("p");
        ps.forEach((p) => {
          (p as HTMLElement).style.margin = "0.25rem 0";
        });

        cardClone.style.paddingBottom = "0.75rem";

        wrapper.appendChild(cardClone);

        const originalCard = document.querySelector(
          `#monster-${monster.id} article`,
        ) as HTMLElement;
        const originalWidth = originalCard.offsetWidth;
        cardClone.style.width = `${originalWidth}px`;

        const canvas = await html2canvas(wrapper, {
          scale: 2,
          backgroundColor: null, // Transparent background
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
    <div className="d-card-actions">
      {showActions && monster.visibility === "public" && (
        <div className="d-badge d-badge-soft d-badge-success mr-2">Public</div>
      )}

      <Dropdown
        position="top"
        alignment="end"
        menuClassName="min-w-38"
        summary={
          <span>
            <Share className="w-5 h-5 text-base-content/50" />
          </span>
        }
        items={[
          {
            element: (
              <Link
                className="flex gap-2 items-center"
                href={`/m/${monster.id}`}
              >
                <Expand className="w-4 h-4" />
                Monster Detail
              </Link>
            ),
          },
          {
            element: (
              <>
                <LinkIcon className="w-4 h-4" />
                Copy Link
              </>
            ),
            onClick: copyMonsterLink,
          },
          {
            element: (
              <>
                <Download className="w-4 h-4" />
                Card Image
              </>
            ),
            onClick: downloadCard,
          },
        ]}
      />

      {showActions && (
        <>
          <Link href={`/my/monsters/${monster.id}/edit`}>
            <Pencil className="w-5 h-5 text-base-content/50" />
          </Link>
          <button
            disabled={isPending}
            onClick={() => {
              if (window.confirm("Really? This is permanent.")) {
                startTransition(async () => {
                  const result = await deleteMonster(monster.id);
                  if (!result.success && result.error) {
                    alert(`Error deleting monster: ${result.error}`);
                  }
                });
              }
            }}
          >
            <Trash
              className={`w-5 h-5 text-base-content/50 cursor-pointer ${isPending ? "opacity-50" : ""}`}
            />
          </button>
        </>
      )}
    </div>
  );
}
