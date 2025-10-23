"use client";

import { Link as LinkIcon, Plus } from "lucide-react";
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
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    const results = await searchEntitiesAction(entityType, searchQuery);
    setSearchResults(results);
  };

  const handleSubmit = (formData: FormData) => {
    if (!selectedEntity) return;
    formData.append("entityType", entityType);
    formData.append("entityId", selectedEntity.id);
    onSubmit(formData);
    setSelectedEntity(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={entityTypeId}>Entity Type</Label>
        <Select
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value);
            setSelectedEntity(null);
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
        <Label htmlFor={entitySearchId}>Search Entity</Label>
        <div className="flex gap-2">
          <Input
            id={entitySearchId}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to search..."
          />
          <Button type="button" onClick={handleSearch} variant="outline">
            Search
          </Button>
        </div>
        {searchResults.length > 0 && (
          <div className="rounded-md border">
            {searchResults.map((entity) => (
              <button
                type="button"
                key={entity.id}
                onClick={() => {
                  setSelectedEntity(entity);
                  setSearchResults([]);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {entity.name}
              </button>
            ))}
          </div>
        )}
        {selectedEntity && (
          <div className="text-sm text-muted-foreground">
            Selected: {selectedEntity.name}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={awardId}>Award</Label>
        <Select name="awardId" required>
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
        disabled={!selectedEntity}
        className="flex items-center gap-2"
      >
        <Plus className="size-4" />
        <LinkIcon className="size-4" />
        Add Association
      </Button>
    </form>
  );
}
