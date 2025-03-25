export interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  className?: string;
  rows?: number;
  onChange: (value: string) => void;
}

export const FormTextarea = ({
  label,
  name,
  value,
  className = "",
  rows = 3,
  onChange,
}: FormTextareaProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };
  return (
    <div className={className}>
      <label htmlFor={name} className="d-fieldset-label">
        {label}
      </label>
      <div>
        <textarea
          name={name}
          id={name}
          value={value}
          rows={rows}
          onChange={handleChange}
          className="d-textarea w-full"
        />
      </div>
    </div>
  );
};
