"use client";

import { Link as LinkIcon, Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { searchEntitiesAction } from "@/app/admin/actions";
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
import type { Award } from "@/lib/types";

interface AwardAssociationFormProps {
  awards: Award[];
  onSubmit: (formData: FormData) => void;
}

interface Entity {
  id: string;
  name: string;
}

export function AwardAssociationForm({
  awards,
  onSubmit,
}: AwardAssociationFormProps) {
  const entityTypeId = useId();
  const entitySearchId = useId();
  const awardId = useId();
  const [entityType, setEntityType] = useState("monster");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
  const [selectedAwardId, setSelectedAwardId] = useState<string>("");

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    const results = await searchEntitiesAction(entityType, searchQuery);
    setSearchResults(results);
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
    if (selectedEntities.length === 0 || !selectedAwardId) return;

    for (const entity of selectedEntities) {
      const formData = new FormData();
      formData.append("entityType", entityType);
      formData.append("entityId", entity.id);
      formData.append("awardId", selectedAwardId);
      await onSubmit(formData);
    }

    setSelectedEntities([]);
    setSelectedAwardId("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={entityTypeId}>Entity Type</Label>
        <Select
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value);
            setSelectedEntities([]);
            setSearchResults([]);
          }}
        >
          <SelectTrigger id={entityTypeId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monster">Monster</SelectItem>
            <SelectItem value="item">Item</SelectItem>
            <SelectItem value="companion">Companion</SelectItem>
            <SelectItem value="subclass">Subclass</SelectItem>
            <SelectItem value="school">Spell School</SelectItem>
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
        disabled={selectedEntities.length === 0 || !selectedAwardId}
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
