"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Monster } from "@/lib/types";
import { Card } from "@/ui/monster/Card";
import { Search, X, Ghost, Crown, ArrowUp, ArrowDown } from "lucide-react";
import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface MonstersListViewProps {
  monsters: Monster[];
  initialSelectedId?: string;
}

export const MonstersListView: React.FC<MonstersListViewProps> = ({
  monsters,
  initialSelectedId,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState({ field: "name", direction: "asc" });
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(
    initialSelectedId || null,
  );
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedMonsterId(initialSelectedId);
    }
  }, [initialSelectedId]);

  const handleSearch = (q: string) => {
    setSearchTerm(q);
    const params = new URLSearchParams(searchParams);
    params.set("q", q);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    if (
      searchParams.get("id") &&
      !filteredMonsters.find((monster) => monster.id === selectedMonsterId)
    ) {
      const firstMonsterId = filteredMonsters[0]?.id;
      if (!firstMonsterId) return;
      setSelectedMonsterId(firstMonsterId);
      params.set("id", firstMonsterId || "");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const filteredMonsters = useMemo(() => {
    return monsters
      .filter(
        (monster) =>
          !searchTerm ||
          monster.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => {
        const fieldA = a[sortBy.field as keyof Monster];
        const fieldB = b[sortBy.field as keyof Monster];

        if (typeof fieldA === "string" && typeof fieldB === "string") {
          return sortBy.direction === "asc"
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA);
        }

        if (typeof fieldA === "number" && typeof fieldB === "number") {
          return sortBy.direction === "asc" ? fieldA - fieldB : fieldB - fieldA;
        }

        return 0;
      });
  }, [monsters, searchTerm, sortBy]);

  useEffect(() => {
    if (!searchParams.get("id")) {
      setSelectedMonsterId(null);
    }
  }, [searchParams]);

  const selectedMonster = useMemo(() => {
    return monsters.find((m) => m.id === selectedMonsterId);
  }, [monsters, selectedMonsterId]);

  const toggleSort = (field: string) => {
    setSortBy((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { field, direction: "asc" };
    });
  };

  const handleMonsterClick = (monsterId: string) => {
    setSelectedMonsterId(monsterId);
    const params = new URLSearchParams(searchParams);
    params.set("id", monsterId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left side: List with filters */}
      <div className="w-full lg:w-1/3 flex flex-col">
        {/* Search controls */}
        <div className="mb-4">
          <div className="flex mb-2">
            <div className="d-input flex-grow relative">
              <Search />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => handleSearch("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 cursor-pointer" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sort controls */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-base-content/70">
            {filteredMonsters.length} monsters
          </span>

          <div className="flex gap-2">
            <div className="d-dropdown d-dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="d-btn d-btn-sm d-btn-ghost"
              >
                <span>
                  {sortBy.field === "hp"
                    ? "HP"
                    : sortBy.field.charAt(0).toUpperCase() +
                      sortBy.field.slice(1)}
                </span>
              </div>
              <ul
                tabIndex={0}
                className="d-dropdown-content z-10 text-sm shadow bg-base-100 w-32"
              >
                <li
                  className="flex justify-between items-center w-full px-2 py-1 hover:bg-base-200"
                  onClick={() => toggleSort("name")}
                >
                  Name
                </li>
                <li
                  className="flex justify-between items-center w-full px-2 py-1 hover:bg-base-200"
                  onClick={() => toggleSort("level")}
                >
                  Level
                </li>
                <li
                  className="flex justify-between items-center w-full px-2 py-1 hover:bg-base-200"
                  onClick={() => toggleSort("hp")}
                >
                  HP
                </li>
              </ul>
            </div>
            <button
              className="inline-flex cursor-pointer items-center"
              onClick={() =>
                setSortBy((prev) => ({
                  ...prev,
                  direction: prev.direction === "asc" ? "desc" : "asc",
                }))
              }
              aria-label="Toggle sort direction"
            >
              <ArrowUp
                className={clsx(
                  "h-4 w-4",
                  sortBy.direction === "asc" && "stroke-primary",
                )}
              />
              <ArrowDown
                className={clsx(
                  "h-4 w-4",
                  sortBy.direction === "desc" && "stroke-primary",
                )}
              />
            </button>
          </div>
        </div>

        {/* Monster list */}
        <div className="list overflow-y-auto max-h-[70vh]">
          {filteredMonsters && (
            <ul className="divide-y divide-base-300">
              {filteredMonsters.map((monster) => (
                <li
                  key={monster.id}
                  className={clsx(
                    "block p-3 transition-colors",
                    selectedMonsterId === monster.id
                      ? "bg-primary/10"
                      : "hover:bg-base-200",
                  )}
                  onClick={() => handleMonsterClick(monster.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">
                        {monster.legendary && (
                          <Crown
                            size={14}
                            className="inline align-baseline mr-1"
                          />
                        )}
                        {monster.name}
                      </h3>
                      <p className="text-sm text-base-content/70">
                        Level {monster.level}
                        {monster.legendary ? " Solo " : ", "}
                        {monster.size.charAt(0).toUpperCase() +
                          monster.size.slice(1)}{" "}
                        {monster.kind}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center mr-2">
                        <span className="mr-1">HP:</span>
                        <span className="font-medium">{monster.hp}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right side: Detail view */}
      <div className="w-full lg:w-2/3">
        {selectedMonster ? (
          <div className="sticky top-4">
            <Card
              monster={selectedMonster}
              creator={selectedMonster.creator}
              showActions={false}
            />
          </div>
        ) : (
          <div className="d-card d-card-bordered bg-base-100 p-8 h-full flex items-center justify-center text-center">
            <Ghost className="stroke-base-300" size={96} />
          </div>
        )}
      </div>
    </div>
  );
};
