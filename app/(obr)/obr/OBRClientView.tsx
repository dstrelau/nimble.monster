"use client";

import OBR, { buildImage } from "@owlbear-rodeo/sdk";
import { useEffect, useRef, useState } from "react";
import { getPublicMonster } from "@/app/monsters/actions";
import { CompactCard } from "@/app/ui/monster/CompactCard";
import { MonsterSearch } from "@/app/ui/owlbear/MonsterSearch";
import { getPaperforgeImageUrl } from "@/components/PaperforgeImage";
import { getPluginId } from "@/lib/owlbear/utils";
import {
  getPaperforgeEntry,
  type PaperForgeEntry,
} from "@/lib/paperforge-catalog";
import type { Monster } from "@/lib/services/monsters/types";
import { PluginGate } from "./PluginGate";

function OwlbearExtension() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (OBR.isAvailable) {
      OBR.onReady(() => setReady(true));
    }
  }, []);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(
    null
  );
  const [monster, setMonster] = useState<Monster | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSelection = async () => {
      const selection = await OBR.player.getSelection();
      if (selection && selection.length > 0) {
        const items = await OBR.scene.items.getItems(selection);
        if (items.length > 0) {
          setHasSelection(true);
          const item = items[0];
          const monsterId = item.metadata[getPluginId("monsterId")] as
            | string
            | undefined;
          setSelectedMonsterId(monsterId || null);

          if (monsterId) {
            setLoading(true);
            setError(null);
            try {
              const fetchedMonster = await getPublicMonster(monsterId);
              if (!fetchedMonster) {
                setError("Monster not found");
                setMonster(null);
              } else {
                setMonster(fetchedMonster);
              }
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to load monster"
              );
              setMonster(null);
            } finally {
              setLoading(false);
            }
          }
        } else {
          setHasSelection(false);
          setSelectedMonsterId(null);
        }
      } else {
        setHasSelection(false);
        setSelectedMonsterId(null);
      }
    };

    checkSelection();

    const unsubscribe = OBR.player.onChange(checkSelection);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        OBR.action.setHeight(Math.min(height + 20, 800));
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="text-center text-muted-foreground">
          Connecting to Owlbear Rodeo...
        </div>
      </div>
    );
  }
  const handleMonsterSelect = async (selectedMonster: Monster) => {
    setMonster(selectedMonster);
  };

  const handleLinkToken = async () => {
    if (!monster) return;

    const selection = await OBR.player.getSelection();
    if (selection && selection.length > 0) {
      const isCurrentlyLinked = selectedMonsterId === monster.id;

      if (isCurrentlyLinked) {
        await OBR.scene.items.updateItems(selection, (items) => {
          for (const item of items) {
            delete item.metadata[getPluginId("monsterId")];
          }
        });
        setSelectedMonsterId(null);
      } else {
        await OBR.scene.items.updateItems(selection, (items) => {
          for (const item of items) {
            item.metadata[getPluginId("monsterId")] = monster.id;
          }
        });
        setSelectedMonsterId(monster.id);
      }
    }
  };

  const handleAddToScene = async () => {
    if (!monster || !monster.paperforgeId) return;

    const sizeToScale: Record<Monster["size"], number> = {
      tiny: 0.5,
      small: 1,
      medium: 1,
      large: 2,
      huge: 3,
      gargantuan: 4,
    };

    const scale = sizeToScale[monster.size] || 1;

    const width = await OBR.viewport.getWidth();
    const height = await OBR.viewport.getHeight();
    const jitterX = (Math.random() - 0.5) * 2 * 0.05 * width;
    const jitterY = (Math.random() - 0.5) * 2 * 0.05 * height;
    const screenCenter = { x: width / 2 + jitterX, y: height / 2 + jitterY };
    const worldCenter = await OBR.viewport.inverseTransformPoint(screenCenter);

    const dpi = 100;
    const pixelSize = scale * dpi;

    const entry = getPaperforgeEntry(monster.paperforgeId) as PaperForgeEntry;
    const imageUrl = getPaperforgeImageUrl(entry.folder, 400);

    const item = buildImage(
      {
        url: imageUrl,
        mime: "image/png",
        width: pixelSize,
        height: pixelSize,
      },
      {
        dpi,
        offset: { x: pixelSize / 2, y: pixelSize / 2 },
      }
    )
      .position({ x: worldCenter.x, y: worldCenter.y })
      .layer("CHARACTER")
      .name(monster.name)
      .metadata({ [getPluginId("monsterId")]: monster.id })
      .build();

    await OBR.scene.items.addItems([item]);
  };

  const handleBack = () => {
    setMonster(null);
  };

  return (
    <div ref={containerRef} className="h-screen w-full">
      {loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading monster...</div>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-full">
          <div className="text-destructive">{error}</div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={monster ? "hidden" : ""}>
            <MonsterSearch onSelect={handleMonsterSelect} />
          </div>
          {monster && (
            <CompactCard
              monster={monster}
              onBack={handleBack}
              hasSelection={hasSelection}
              isLinked={selectedMonsterId === monster.id}
              onLinkToken={handleLinkToken}
              onAddToScene={handleAddToScene}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function OBRClientView() {
  return (
    <PluginGate>
      <OwlbearExtension />
    </PluginGate>
  );
}
