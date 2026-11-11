"use client";

import { Link as LinkIcon, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  type AwardEntityType,
  addAwardAssociation,
} from "@/app/%5Factions/_award/contract";
import { searchAwardEntities } from "@/app/%5Factions/searchAwardEntities/contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { call } from "@/lib/contract";
import type { Award } from "@/lib/types";

interface AwardAssociationFormProps {
  awards: Award[];
}

interface Entity {
  id: string;
  name: string;
}

export function AwardAssociationForm({ awards }: AwardAssociationFormProps) {
  const router = useRouter();
  const entityTypeId = useId();
  const entitySearchId = useId();
  const awardId = useId();
  const [entityType, setEntityType] = useState<AwardEntityType>("monster");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
  const [selectedAwardId, setSelectedAwardId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setError(null);
    try {
      const results = await call(searchAwardEntities, {
        entityType,
        query: searchQuery,
      });
      setSearchResults(results);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Search failed");
    }
  };

  const handleSelectEntity = (entity: Entity) => {
    if (!selectedEntities.find((e) => e.id === entity.id)) {
      setSelectedEntities([...selectedEntities, entity]);
    }
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleRemoveEntity = (entityId: string) => {
    setSelectedEntities(selectedEntities.filter((e) => e.id !== entityId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selectedEntities.length === 0 || !selectedAwardId) return;

    setPending(true);
    try {
      for (const entity of selectedEntities) {
        await call(addAwardAssociation, {
          entityType,
          entityId: entity.id,
          awardId: selectedAwardId,
        });
        setSelectedEntities((current) =>
          current.filter((e) => e.id !== entity.id)
        );
      }
      setSelectedAwardId("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to add association"
      );
    } finally {
      setPending(false);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor={entityTypeId}>Entity Type</Label>
        <Select
          value={entityType}
          onValueChange={(value: AwardEntityType) => {
            setEntityType(value);
            setSelectedEntities([]);
            setSearchResults([]);
          }}
        >
          <SelectTrigger id={entityTypeId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ancestry">Ancestry</SelectItem>
            <SelectItem value="background">Background</SelectItem>
            <SelectItem value="companion">Companion</SelectItem>
            <SelectItem value="item">Item</SelectItem>
            <SelectItem value="monster">Monster</SelectItem>
            <SelectItem value="school">Spell School</SelectItem>
            <SelectItem value="subclass">Subclass</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={entitySearchId}>Search Entities</Label>
        <div className="flex gap-2">
          <Input
            id={entitySearchId}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to search..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <Button type="button" onClick={handleSearch} variant="outline">
            Search
          </Button>
        </div>
        {searchResults.length > 0 && (
          <div className="rounded-md border max-h-48 overflow-y-auto">
            {searchResults.map((entity) => (
              <button
                type="button"
                key={entity.id}
                onClick={() => handleSelectEntity(entity)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {entity.name}
              </button>
            ))}
          </div>
        )}
        {selectedEntities.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Selected ({selectedEntities.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedEntities.map((entity) => (
                <div
                  key={entity.id}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-muted rounded"
                >
                  <span>{entity.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEntity(entity.id)}
                    className="hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={awardId}>Award</Label>
        <Select
          value={selectedAwardId}
          onValueChange={setSelectedAwardId}
          required
        >
          <SelectTrigger id={awardId}>
            <SelectValue placeholder="Select an award" />
          </SelectTrigger>
          <SelectContent>
            {awards.map((award) => (
              <SelectItem key={award.id} value={award.id}>
                {award.name} ({award.abbreviation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={pending || selectedEntities.length === 0 || !selectedAwardId}
        className="flex items-center gap-2"
      >
        <Plus className="size-4" />
        <LinkIcon className="size-4" />
        Add {selectedEntities.length > 0 && `(${selectedEntities.length})`}{" "}
        Association{selectedEntities.length !== 1 ? "s" : ""}
      </Button>
    </form>
  );
}
