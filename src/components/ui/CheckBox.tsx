import clsx from 'clsx';
import { JSX } from 'preact';

function CheckBox({
  checked,
  onChange,
  title,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  disabled: boolean;
}) {
  const _id = `checkbox-${Math.random()}`;

  return (
    <label
      className={clsx('flex items-center gap-2 text-sm', disabled && 'opacity-40')}
      htmlFor={_id}
    >
      <input
        type="checkbox"
        id={_id}
        checked={checked}
        onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => onChange(e.currentTarget.checked)}
        disabled={disabled}
        className="w-4 h-4"
      />
      {title}
    </label>
  );
}

export default CheckBox;
