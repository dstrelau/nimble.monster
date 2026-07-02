"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { Check, ChevronsUpDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/app/UserAvatar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  getTopItemCreators,
  getTopMonsterCreators,
  searchCreators,
} from "./search-creators-action";

interface CreatorComboboxProps {
  kind: "monsters" | "items";
  value: string | null;
  onChange: (userId: string | null) => void;
}

export function CreatorCombobox({
  kind,
  value,
  onChange,
}: CreatorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [rawQuery, setRawQuery] = useState("");
  const [query] = useDebouncedValue(rawQuery, { wait: 250 });
  const [results, setResults] = useState<User[]>([]);
  const [topCreators, setTopCreators] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: session } = useSession();

  const currentUser: User | null = session?.user
    ? {
        id: session.user.id,
        discordId: session.user.discordId ?? "",
        username: session.user.username ?? "",
        displayName: session.user.displayName ?? "",
        imageUrl: session.user.imageUrl ?? undefined,
      }
    : null;

  useEffect(() => {
    const fetcher =
      kind === "monsters" ? getTopMonsterCreators : getTopItemCreators;
    fetcher().then(setTopCreators);
  }, [kind]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    searchCreators(query).then(setResults);
  }, [query]);

  const displayedUsers = query ? results : topCreators;
  const filteredUsers = displayedUsers.filter((u) => u.id !== currentUser?.id);

  const handleSelect = (user: User | null) => {
    setSelectedUser(user);
    onChange(user?.id ?? null);
    setOpen(false);
  };

  const displayUser =
    value === null
      ? null
      : value === currentUser?.id
        ? currentUser
        : selectedUser;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-fit justify-between gap-2"
        >
          {displayUser ? (
            <>
              <UserAvatar user={displayUser} size={20} />
              {displayUser.displayName}
            </>
          ) : (
            "All Creators"
          )}
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search creators..."
            value={rawQuery}
            onValueChange={setRawQuery}
          />
          <CommandList>
            <CommandEmpty>No creators found.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => handleSelect(null)}>
                All Creators
                <Check
                  className={cn(
                    "ml-auto",
                    value === null ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
              {currentUser && (
                <CommandItem onSelect={() => handleSelect(currentUser)}>
                  <UserAvatar user={currentUser} size={20} />
                  {currentUser.displayName}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === currentUser.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              )}
              {filteredUsers.map((user) => (
                <CommandItem key={user.id} onSelect={() => handleSelect(user)}>
                  <UserAvatar user={user} size={20} />
                  {user.displayName}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
