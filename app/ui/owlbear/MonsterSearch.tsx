import { useEffect, useState } from "react";
import { paginatePublicMonsters } from "@/app/monsters/actions";
import { PaperforgeImage } from "@/components/PaperforgeImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Monster } from "@/lib/services/monsters/types";

interface MonsterSearchProps {
  onSelect: (monster: Monster) => void;
}

export function MonsterSearch({ onSelect }: MonsterSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchTerm) {
      setMonsters([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await paginatePublicMonsters({
          search: searchTerm,
          limit: 20,
          sort: "name",
        });
        setMonsters(result.data.filter((m) => m.paperforgeId || m.imageUrl));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Input
          type="text"
          placeholder="Search monsters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading && (
            <div className="text-center text-muted-foreground py-8">
              Loading...
            </div>
          )}

          {error && (
            <div className="text-center text-destructive py-8">{error}</div>
          )}

          {!loading && !error && monsters.length === 0 && searchTerm && (
            <div className="text-center text-muted-foreground py-8">
              No monsters found
            </div>
          )}

          {!loading && !error && monsters.length > 0 && (
            <ul className="space-y-2">
              {monsters.map((monster) => (
                <li key={monster.id}>
                  <button
                    type="button"
                    className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    onClick={() => onSelect(monster)}
                  >
                    <div className="flex items-center gap-3">
                      {monster.paperforgeId && (
                        <PaperforgeImage
                          id={monster.paperforgeId}
                          className="size-10 flex-shrink-0"
                          size={40}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{monster.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Level {monster.level} {monster.size}{" "}
                          {monster.kind || ""}
                          {monster.legendary && " (Legendary)"}
                        </div>
                      </div>
                      {monster.creator.displayName && (
                        <Avatar className="size-8 flex-shrink-0">
                          <AvatarImage
                            src={monster.creator.imageUrl}
                            alt={monster.creator.displayName}
                          />
                          <AvatarFallback>
                            {monster.creator.displayName
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
