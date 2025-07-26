import * as React from "react"
import { Label } from "./label"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { cn } from "../../../lib/utils"

interface FormFieldProps {
  label: string
  name: string
  className?: string
  error?: string
  children?: React.ReactNode
}

export const FormField = ({ label, name, className, error, children }: FormFieldProps) => (
  <div className={cn("space-y-2", className)}>
    <Label htmlFor={name}>{label}</Label>
    {children}
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
)

export interface FormInputProps {
  label: string
  name: string
  value: string
  type?: string
  placeholder?: string
  className?: string
  error?: string
  onChange: (value: string) => void
}

export const FormInput = ({
  label,
  name,
  value,
  type = "text",
  placeholder,
  className,
  error,
  onChange,
}: FormInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <FormField label={label} name={name} className={className} error={error}>
      <Input
        type={type}
        name={name}
        id={name}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        className={error ? "border-destructive" : ""}
      />
    </FormField>
  )
}

export interface FormTextareaProps {
  label: string
  name: string
  value: string
  rows?: number
  placeholder?: string
  className?: string
  error?: string
  onChange: (value: string) => void
}

export const FormTextarea = ({
  label,
  name,
  value,
  rows = 3,
  placeholder,
  className,
  error,
  onChange,
}: FormTextareaProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <FormField label={label} name={name} className={className} error={error}>
      <Textarea
        name={name}
        id={name}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={handleChange}
        className={error ? "border-destructive" : ""}
      />
    </FormField>
  )
}