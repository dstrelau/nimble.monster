import type React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface FormInputProps<T extends string | number> {
  label: React.ReactNode;
  name: string;
  value: T;
  type?: string;
  className?: string;
  onChange: (value: T) => void;
}

export function FormInput<T extends string | number>({
  label,
  name,
  value,
  type,
  className,
  onChange,
}: FormInputProps<T>) {
  if (!type) {
    type = typeof value === "number" ? "number" : "text";
  }
  const handleChange = (newValue: string) => {
    const convertedValue =
      type === "number" ? (Number(newValue) as T) : (newValue as T);
    onChange(convertedValue);
  };
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="gap-1" htmlFor={name}>
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleChange(e.target.value)
        }
      />
    </div>
  );
}

export interface FormTextareaProps {
  label: React.ReactNode;
  name: string;
  value: string;
  rows?: number;
  className?: string;
  onChange: (value: string) => void;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  name,
  value,
  rows = 3,
  className,
  onChange,
}) => (
  <div className={cn("space-y-2", className)}>
    <Label htmlFor={name}>{label}</Label>
    <ShadcnTextarea
      id={name}
      name={name}
      value={value}
      rows={rows}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        onChange(e.target.value)
      }
    />
  </div>
);

export interface FormSelectProps<T extends string> {
  label: React.ReactNode;
  name: string;
  className?: string;
  choices: ReadonlyArray<{ readonly value: T; readonly label: string }>;
  selected: T;
  onChange: (value: T) => void;
}

export function FormSelect<T extends string>({
  label,
  name,
  className,
  choices,
  selected,
  onChange,
}: FormSelectProps<T>) {
  return (
    <div className={cn("width-full space-y-2", className)}>
      <Label className="gap-1" htmlFor={name}>
        {label}
      </Label>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger className="w-full" id={name}>
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

export interface IconFormInputProps<T extends string | number> {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  name: string;
  value: T;
  type?: string;
  className?: string;
  onChange: (value: T) => void;
}

export function IconFormInput<T extends string | number>({
  icon: Icon,
  text,
  name,
  value,
  type,
  className = "",
  onChange,
}: IconFormInputProps<T>) {
  return (
    <FormInput
      label={
        <>
          <Icon className="h-4 w-4 stroke-gray-400 fill-gray-300" />
          {text}
        </>
      }
      name={name}
      value={value}
      type={type}
      className={className}
      onChange={onChange}
    />
  );
}

export interface IconFormSelectProps<T extends string> {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  name: string;
  choices: ReadonlyArray<{ readonly value: T; readonly label: string }>;
  selected: T;
  className?: string;
  onChange: (value: T) => void;
}

export function IconFormSelect<T extends string>({
  icon: Icon,
  text,
  name,
  choices,
  selected,
  className = "",
  onChange,
}: IconFormSelectProps<T>) {
  return (
    <div className={cn(className)}>
      <FormSelect
        label={
          <>
            <Icon className="h-4 w-4 stroke-gray-400 fill-gray-300" />
            {text}
          </>
        }
        name={name}
        choices={choices}
        selected={selected}
        // className={className}
        onChange={onChange}
      />
    </div>
  );
}
