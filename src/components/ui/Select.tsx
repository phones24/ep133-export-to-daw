import clsx from 'clsx';
import { JSX } from 'preact';

interface SelectProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  children: any;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'secondary' | 'outlined' | 'tertiary' | 'ghost' | 'icon';
}

function Select({
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  ...props
}: SelectProps) {
  const variantClasses = {
    primary: 'bg-gray-100 hover:bg-[#d0d2d0] active:bg-[#c5c7c5] border-1 border-black',
    secondary: 'bg-gray-100 hover:bg-gray-300 active:bg-gray-400 border-1 border-black',
    tertiary: 'bg-[#c6d1d7] hover:bg-gray-100 active:bg-gray-200 border-1 border-black',
    outlined: 'bg-transparent hover:bg-black/10 active:bg-black/20 border-1 border-black',
    ghost: 'border-0 bg-transparent hover:bg-black/10 active:bg-black/20',
    icon: 'border-0 bg-transparent',
  } as const;

  const sizeClasses = {
    sm: {
      wrapper: 'h-[28px]',
      select: 'relative h-[28px] px-1 py-0 text-sm -top-[1px]',
    },
    md: {
      wrapper: 'h-[42px]',
      select: 'h-[42px] p-2 text-sm',
    },
  } as const;

  return (
    <div
      className={clsx(
        'px-2 transition-colors duration-200',
        variantClasses[variant],
        sizeClasses[size].wrapper,
        className,
      )}
    >
      <select
        className={clsx(
          'outline-none disabled:opacity-80 disabled:cursor-not-allowed disabled:text-gray-400 w-full cursor-pointer bg-transparent',
          sizeClasses[size].select,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export default Select;
