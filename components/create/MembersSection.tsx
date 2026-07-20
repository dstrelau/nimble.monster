import { Plus, Trash } from "lucide-react";
import { useId } from "react";
import { AbilitiesSection } from "@/components/create/AbilitiesSection";
import { ActionsSection } from "@/components/create/ActionsSection";
import { ArmorIcon, HPIcon, SavesIcon } from "@/components/monster/Stat";
import {
  FormInput,
  FormSelect,
  IconFormInput,
  IconFormSelect,
} from "@/components/shared/Form";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import type { MonsterTeamMember } from "@/lib/services/monsters";
import { ARMORS, SIZES } from "@/lib/services/monsters";
import { cn } from "@/lib/utils";

const newMemberId = () => Math.random().toString(36).slice(2);

const emptyMember = (): MonsterTeamMember => ({
  id: newMemberId(),
  name: "",
  kind: "",
  hp: 0,
  hpPerHero: null,
  armor: "none",
  size: "medium",
  saves: "",
  actionPreface: "",
  abilities: [],
  actions: [],
});

const MemberHPInput: React.FC<{
  member: MonsterTeamMember;
  onChange: (patch: Partial<MonsterTeamMember>) => void;
  className?: string;
}> = ({ member, onChange, className }) => {
  const perHeroId = useId();
  const perHeroEnabled = member.hpPerHero != null;

  const perHeroToggle = (
    <Toggle
      id={`hp-per-hero-${perHeroId}`}
      variant="outline"
      size="sm"
      pressed={perHeroEnabled}
      onPressedChange={(pressed) =>
        onChange({ hpPerHero: pressed ? (member.hpPerHero ?? 0) : null })
      }
    >
      per hero
    </Toggle>
  );

  const label = (
    <>
      <span>
        <HPIcon className="h-4 w-4 mr-0.5 inline stroke-hp" />
        HP
      </span>
      {perHeroToggle}
    </>
  );

  return (
    <div className={cn("space-y-2", className)}>
      {perHeroEnabled ? (
        <FormInput
          name="member-hp-per-hero"
          value={member.hpPerHero ?? 0}
          labelClassName="h-8"
          label={label}
          onChange={(value) => onChange({ hpPerHero: Math.max(0, value) })}
        />
      ) : (
        <FormInput
          name="member-hp"
          value={member.hp}
          labelClassName="h-8"
          label={label}
          onChange={(value) => onChange({ hp: Math.max(0, value) })}
        />
      )}
    </div>
  );
};

const MemberRow: React.FC<{
  member: MonsterTeamMember;
  index: number;
  onChange: (member: MonsterTeamMember) => void;
  onRemove: () => void;
}> = ({ member, index, onChange, onRemove }) => {
  const patch = (fields: Partial<MonsterTeamMember>) =>
    onChange({ ...member, ...fields });

  return (
    <div className="rounded-md border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-sans font-bold">Member {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove member ${index + 1}`}
        >
          <Trash className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-6">
        <FormInput
          label="Name"
          name="member-name"
          value={member.name}
          onChange={(name) => patch({ name })}
        />
        <FormInput
          label="Kind"
          name="member-kind"
          value={member.kind || ""}
          onChange={(kind) => patch({ kind })}
        />
      </div>
      <div className="grid grid-cols-12 gap-x-4">
        <MemberHPInput
          member={member}
          onChange={patch}
          className="col-span-4"
        />
        <IconFormSelect
          icon={ArmorIcon}
          text="Armor"
          name="member-armor"
          choices={ARMORS}
          selected={member.armor}
          className="col-span-3"
          labelClassName="h-8"
          onChange={(armor) => patch({ armor })}
        />
        <FormSelect
          label="Size"
          name="member-size"
          choices={SIZES}
          selected={member.size}
          className="col-span-2"
          labelClassName="h-8"
          onChange={(size) => patch({ size })}
        />
        <IconFormInput
          icon={SavesIcon}
          text="Saves"
          name="member-saves"
          value={member.saves || ""}
          className="col-span-3"
          labelClassName="h-8"
          onChange={(saves) => patch({ saves })}
        />
      </div>
      <AbilitiesSection
        abilities={member.abilities}
        onChange={(abilities) => patch({ abilities })}
      />
      <ActionsSection
        actions={member.actions}
        actionPreface={member.actionPreface || ""}
        showDamage={false}
        onChange={(actions) => patch({ actions })}
        onPrefaceChange={(actionPreface) => patch({ actionPreface })}
      />
    </div>
  );
};

interface MembersSectionProps {
  members: MonsterTeamMember[];
  onChange: (members: MonsterTeamMember[]) => void;
}

export const MembersSection: React.FC<MembersSectionProps> = ({
  members,
  onChange,
}) => (
  <fieldset className="flex flex-col gap-4">
    <legend className="font-sans mb-4 font-bold">Members</legend>
    <div className="flex flex-col gap-4">
      {members.map((member, index) => (
        <MemberRow
          key={member.id}
          member={member}
          index={index}
          onChange={(newMember) => {
            const next = [...members];
            next[index] = newMember;
            onChange(next);
          }}
          onRemove={() => onChange(members.filter((_, i) => i !== index))}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        className="text-muted-foreground"
        onClick={() => onChange([...members, emptyMember()])}
      >
        <Plus className="w-6 h-6" />
        Add Member
      </Button>
    </div>
  </fieldset>
);

export { emptyMember };
