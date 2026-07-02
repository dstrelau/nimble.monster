"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUBCLASS_CLASSES } from "@/lib/types";

interface SubclassClassSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const SubclassClassSelect: React.FC<SubclassClassSelectProps> = ({
  value,
  onChange,
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="All Classes" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Classes</SelectItem>
        {SUBCLASS_CLASSES.map((classOption) => (
          <SelectItem key={classOption.value} value={classOption.value}>
            {classOption.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
