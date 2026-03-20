import { Controller, FieldPath, FieldValues, useFormContext } from 'react-hook-form';
import CheckBox from '../ui/CheckBox';

function CheckboxField<T extends FieldValues = FieldValues>({
  name,
  title,
  disabled,
  helperText,
  className,
}: {
  name: FieldPath<T>;
  title: string;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <CheckBox
          checked={field.value as boolean}
          onChange={(checked) => field.onChange(checked)}
          title={title}
          disabled={disabled ?? false}
          helperText={helperText}
          className={className}
        />
      )}
    />
  );
}

export default CheckboxField;
