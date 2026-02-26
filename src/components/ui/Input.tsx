import clsx from 'clsx';
import { JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import { twMerge } from 'tailwind-merge';

interface BaseInputProps {
  label?: string;
  type?: 'text' | 'email' | 'textarea' | 'file';
  error?: string;
  className?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  required?: boolean;
  multiple?: boolean;
  accept?: string;
  rows?: number;
}

type InputProps = BaseInputProps &
  (JSX.HTMLAttributes<HTMLInputElement> | JSX.HTMLAttributes<HTMLTextAreaElement>);

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, type = 'text', className = '', disabled = false, ...props }, ref) => {
    const id = props.id || label?.toLowerCase().replace(/\s+/g, '-');
    const inputClasses = twMerge(
      clsx(
        'w-full px-3 py-2 border-1 border-black focus:outline-none focus:ring-0 bg-gray-50',
        disabled && 'opacity-50',
        className,
      ),
    );

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            className={clsx('text-sm font-medium text-black', disabled && 'opacity-50')}
            htmlFor={id}
          >
            {label}
          </label>
        )}
        {type === 'textarea' ? (
          <textarea
            ref={ref as preact.Ref<HTMLTextAreaElement>}
            className={inputClasses}
            id={id}
            {...(props as JSX.HTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as preact.Ref<HTMLInputElement>}
            type={type}
            className={inputClasses}
            id={id}
            {...(props as JSX.HTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>
    );
  },
);

export default Input;
