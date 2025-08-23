"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Eye, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { Card } from "@/app/ui/companion/Card";
import { FormInput, FormSelect, FormTextarea } from "@/components/app/Form";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { fetchApi } from "@/lib/api";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Companion, MonsterSize, User } from "@/lib/types";
import { SIZES } from "@/lib/types";
import { getUserFamilies } from "../actions/family";
import { AbilitiesSection } from "./shared/AbilitiesSection";
import { ActionsSection } from "./shared/ActionsSection";

const EXAMPLE_COMPANIONS: Record<string, Companion> = {
  Stabs: {
    visibility: "public",
    id: "",
    name: "Stabs, the Somewhat Reliable",
    kind: "Kobold",
    class: "The Cheat",
    hp_per_level: "5",
    size: "small" as MonsterSize,
    saves: "DEX+",
    wounds: 3,
    conditions: [],
    abilities: [
      {
        name: "Companion",
        description:
          "Can Interpose for friends (but you'll never hear the end of it!)",
      },
      {
        name: "Pocket Sand!",
        description:
          "(1/encounter) force an adjacent enemy to reroll an attack with disadvantage.",
      },
    ],
    actions: [
      {
        name: "Stab!",
        damage: "1d4",
        description:
          "(Advantage VS [[Distracted]] targets). On Crit: +LVL damage (instead of rolling additional dice)",
      },
      {
        name: "Shadowstep",
        damage: "",
        description:
          "Teleport behind an creature you can see (DC 10 WIL save or [[Frightened]] 1 Turn).",
      },
    ],
    actionPreface: "Each turn, move 4 then choose 1:",
    dyingRule:
      "When Stabs drops to 0 HP, he can turn Invisible until the end of his next turn.",
    updatedAt: new Date().toISOString(),
  },
  empty: {
    visibility: "private",
    id: "",
    name: "",
    kind: "",
    class: "",
    hp_per_level: "",
    size: "medium",
    saves: "",
    wounds: 3,
    conditions: [],
    abilities: [],
    actions: [],
    actionPreface: "Each turn, choose 1:",
    dyingRule: "",
    updatedAt: new Date().toISOString(),
  },
};

const _FamilySection: React.FC<{
  companion: Companion;
  setCompanion: (c: Companion) => void;
}> = ({ companion, setCompanion }) => {
  const userFamilies = useQuery({
    queryKey: ["userFamilies"],
    queryFn: async () => {
      const result = await getUserFamilies();
      return result.success ? result.families : [];
    },
  });

  const handleSelectFamily = (familyId: string) => {
    if (familyId === "none") {
      setCompanion({ ...companion });
    } else {
      const _family = userFamilies.data?.find((f) => f.id === familyId);
      setCompanion({ ...companion });
    }
  };

  const familyChoices = [
    { value: "none", label: "None" },
    ...(userFamilies.data?.map((f) => ({ value: f.id, label: f.name })) || []),
  ];

  return (
    <FormSelect
      label="Family"
      name="family"
      choices={familyChoices}
      selected="none"
      onChange={handleSelectFamily}
    />
  );
};

const CompanionForm: React.FC<{
  companion: Companion;
  setCompanion: (c: Companion) => void;
}> = ({ companion, setCompanion }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-6">
        <FormInput
          label="Name"
          name="name"
          value={companion.name}
          className="col-span-2"
          onChange={(name) => setCompanion({ ...companion, name })}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-6">
        <FormInput
          label="Kind"
          name="kind"
          value={companion.kind}
          onChange={(kind) => setCompanion({ ...companion, kind })}
        />
        <FormInput
          label="Class"
          name="class"
          value={companion.class}
          onChange={(classValue) =>
            setCompanion({ ...companion, class: classValue })
          }
        />
      </div>
      <div className="grid grid-cols-4 gap-x-6">
        <FormInput
          label="HP/LVL"
          name="hp_per_level"
          value={companion.hp_per_level}
          className="col-span-1"
          onChange={(hp_per_level) =>
            setCompanion({ ...companion, hp_per_level })
          }
        />
        <FormSelect
          label="Size"
          name="size"
          choices={SIZES}
          selected={companion.size}
          className="col-span-1"
          onChange={(size) => setCompanion({ ...companion, size })}
        />
        <FormInput
          label="Saves"
          name="saves"
          value={companion.saves}
          className="col-span-1"
          onChange={(saves) => setCompanion({ ...companion, saves })}
        />
        <FormInput
          label="Wounds"
          name="wounds"
          type="number"
          value={companion.wounds}
          className="col-span-1"
          onChange={(wounds) =>
            setCompanion({ ...companion, wounds: Math.max(1, wounds) })
          }
        />
      </div>
      <AbilitiesSection
        abilities={companion.abilities}
        onChange={(abilities) => setCompanion({ ...companion, abilities })}
      />
      <ActionsSection
        actions={companion.actions}
        actionPreface={companion.actionPreface}
        showDamage={true}
        onChange={(actions) => setCompanion({ ...companion, actions })}
        onPrefaceChange={(actionPreface) =>
          setCompanion({ ...companion, actionPreface })
        }
      />
      <FormTextarea
        label={
          <div className="flex items-center gap-2">
            Dying Rule
            <ConditionValidationIcon text={companion.dyingRule} />
          </div>
        }
        name="dyingRule"
        value={companion.dyingRule}
        rows={2}
        onChange={(dyingRule: string) =>
          setCompanion({ ...companion, dyingRule })
        }
      />
      <FormTextarea
        label={
          <div className="flex items-center gap-2">
            More Information
            <ConditionValidationIcon text={companion.moreInfo || ""} />
          </div>
        }
        name="moreInfo"
        value={companion.moreInfo || ""}
        rows={4}
        onChange={(moreInfo: string) =>
          setCompanion({ ...companion, moreInfo })
        }
      />
    </div>
  );
};

interface BuildCompanionProps {
  existingCompanion?: Companion;
}

const BuildCompanion: React.FC<BuildCompanionProps> = ({
  existingCompanion,
}) => {
  const router = useRouter();

  const { data: session } = useSession();
  let creator: User | undefined;
  if (session?.user) {
    creator = {
      discordId: session.user.id,
      avatar: session.user.image || "",
      username: session.user.name || "",
    };
  }

  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [companion, setCompanion] = useState<Companion>(() =>
    existingCompanion
      ? { ...existingCompanion, conditions: [] }
      : EXAMPLE_COMPANIONS.empty
  );
  const queryClient = useQueryClient();

  const { allConditions } = useConditions();

  const companionWithConditions = useMemo(
    () => ({
      ...companion,
      conditions: allConditions.map((c) => ({ ...c, inline: false })),
    }),
    [companion, allConditions]
  );

  const mutation = useMutation({
    mutationFn: async (data: Companion) => {
      const endpoint = data.id
        ? `/api/companions/${data.id}`
        : "/api/companions";
      const method = data.id ? "PUT" : "POST";

      return fetchApi<Companion>(endpoint, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companions"] });
      queryClient.invalidateQueries({ queryKey: ["companion", companion.id] });
      router.push(`/c/${companion.id}`);
    },
    onError: (error) => {
      console.error("Failed to save companion:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(companion);
  };

  const loadExample = (type: keyof typeof EXAMPLE_COMPANIONS) => {
    setCompanion({
      ...EXAMPLE_COMPANIONS[type],
    });
  };

  return (
    <>
      <div
        className={clsx(
          showMobilePreview || "hidden",
          "md:hidden fixed h-full left-0 top-0 inset-0 z-1 bg-background"
        )}
      >
        <div className="w-full flex justify-center items-center sticky bg-secondary text-secondary-foreground p-4">
          <h3 className="font-bold">Companion Preview</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowMobilePreview(false)}
            className="ml-auto"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4">
          <Card companion={companionWithConditions} />
        </div>
      </div>

      <div
        className={clsx(
          "md:hidden fixed bottom-0 left-0 right-0 z-1 w-full bg-background flex p-2 justify-between",
          showMobilePreview && "hidden"
        )}
        onClick={() => setShowMobilePreview(true)}
      >
        <span className="font-slab font-black font-small-caps italic text-2xl">
          {companion.name}
        </span>
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          <Eye className="h-6 w-6" /> Preview
        </div>
      </div>

      <div
        className={clsx(
          "grid grid-cols-6 gap-x-8 mb-10 md:mb-0",
          showMobilePreview && "hidden"
        )}
      >
        <div className="col-span-6 md:col-span-3">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <CompanionForm companion={companion} setCompanion={setCompanion} />

            {session?.user && (
              <div className="flex flex-row justify-between items-center my-4">
                <Button type="submit">Save</Button>
                <fieldset className="space-y-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="public-toggle"
                        checked={companion.visibility === "public"}
                        onCheckedChange={(checked) => {
                          setCompanion({
                            ...companion,
                            visibility: checked ? "public" : "private",
                          });
                        }}
                      />
                      <label
                        htmlFor="public-toggle"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Publish to Public Companions
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}
          </form>
        </div>

        <div className="hidden md:block md:col-span-3">
          <div className="sticky top-4">
            <div className="flex mb-6 mr-5 justify-end">
              <div className="flex gap-2 items-center">
                <span className="text-sm font-medium">Load Example:</span>
                {Object.keys(EXAMPLE_COMPANIONS).map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    onClick={() =>
                      loadExample(type as keyof typeof EXAMPLE_COMPANIONS)
                    }
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-120px)] px-4">
              <Card
                companion={companionWithConditions}
                creator={creator}
                hideActions={true}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuildCompanion;
