import { Controller, FieldPath, FieldValues, useFormContext } from 'react-hook-form';
import Input from '../ui/Input';

function InputField<T extends FieldValues = FieldValues>({
  name,
  label,
  disabled,
  className,
  placeholder,
  transform,
}: {
  name: FieldPath<T>;
  label?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  transform?: (value: string) => string;
}) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          label={label}
          value={field.value as string}
          onChange={(e: Event) => {
            const raw = (e.currentTarget as HTMLInputElement).value;
            field.onChange(transform ? transform(raw) : raw);
          }}
          disabled={disabled}
          className={className}
          placeholder={placeholder}
        />
      )}
    />
  );
}

export default InputField;
