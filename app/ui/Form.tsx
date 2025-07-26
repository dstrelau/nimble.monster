// Import all components first
import { 
  FormInput, 
  FormTextarea, 
  FormField,
  type FormInputProps,
  type FormTextareaProps 
} from "../components/ui/form-field"

// Re-export everything
export { FormInput, FormTextarea, FormField }
export type { FormInputProps, FormTextareaProps }

// Legacy alias for backwards compatibility
export const Textarea = FormTextarea
