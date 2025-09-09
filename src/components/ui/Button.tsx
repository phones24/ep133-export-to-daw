import clsx from 'clsx';
import { JSX } from 'preact';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  children: any;
  size?: 'sm' | 'md';
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-[#dbdddb] hover:bg-[#d0d2d0] active:bg-[#c5c7c5]',
    secondary: 'bg-gray-100 hover:bg-gray-300 active:bg-gray-400',
  };

  const sizeClasses = {
    sm: 'text-sm py-1 px-2 h-[28px]',
    md: 'text-sm py-2 px-4 h-[42px]',
  };

  const baseClasses =
    'text-black cursor-pointer border-1 border-black disabled:opacity-80 disabled:cursor-not-allowed disabled:text-gray-400 outline-none transition-colors duration-200';

  return (
    <button
      type="button"
      className={twMerge(clsx(baseClasses, variantClasses[variant], sizeClasses[size], className))}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
