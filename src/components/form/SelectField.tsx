import { JSX } from 'preact';
import { Controller, FieldPath, FieldValues, useFormContext } from 'react-hook-form';
import Select from '../ui/Select';

function SelectField<T extends FieldValues = FieldValues>({
  name,
  children,
  disabled,
  className,
}: {
  name: FieldPath<T>;
  children: any;
  disabled?: boolean;
  className?: string;
}) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
            field.onChange(e.currentTarget.value)
          }
          value={field.value as string}
          name={name}
          disabled={disabled}
          className={className}
        >
          {children}
        </Select>
      )}
    />
  );
}

export default SelectField;
