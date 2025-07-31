import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FormInputProps {
  label: string;
  name: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}

export interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}

export interface FormSelectProps<T extends string> {
  label: React.ReactNode;
  name: string;
  choices: ReadonlyArray<{ readonly value: T; readonly label: string }>;
  selected: T;
  onChange: (value: T) => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  value,
  type = "text",
  onChange,
}) => (
  <div className="space-y-2">
    <Label htmlFor={name}>{label}</Label>
    <Input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    />
  </div>
);

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  name,
  value,
  rows = 3,
  onChange,
}) => (
  <div className="space-y-2">
    <Label htmlFor={name}>{label}</Label>
    <ShadcnTextarea
      id={name}
      name={name}
      value={value}
      rows={rows}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
    />
  </div>
);

export function FormSelect<T extends string>({
  label,
  name,
  choices,
  selected,
  onChange,
}: FormSelectProps<T>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger id={name}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Legacy aliases for backwards compatibility
export const Textarea = FormTextarea;
export const FormField = FormInput;
