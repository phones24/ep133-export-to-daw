import clsx from 'clsx';
import { JSX } from 'preact';

function CheckBox({
  checked,
  onChange,
  title,
  helperText,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  helperText?: string;
  disabled: boolean;
  className?: string;
}) {
  const _id = `checkbox-${Math.random()}`;

  return (
    <label className={clsx('flex items-center gap-2 text-sm', className)} htmlFor={_id}>
      <input
        type="checkbox"
        id={_id}
        checked={checked}
        onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => onChange(e.currentTarget.checked)}
        disabled={disabled}
        className={clsx('w-4 h-4', disabled && 'opacity-50')}
      />
      <span className={clsx(disabled && 'opacity-50')}>{title}</span>

      {helperText && (
        <div className="relative">
          <div className="text-gray-400 cursor-help peer">🛈</div>
          <div
            className={clsx(
              'absolute shadow-lg bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#b0babe] text-black border-1 border-black text-sm',
              'opacity-0 peer-hover:opacity-100 transition-opacity duration-300 pointer-events-none min-w-[500px] max-w-[600px]',
            )}
          >
            {helperText}
          </div>
        </div>
      )}
    </label>
  );
}

export default CheckBox;
