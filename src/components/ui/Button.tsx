import clsx from 'clsx';
import { JSX } from 'preact';
import { twMerge } from 'tailwind-merge';
import { Link } from 'wouter';

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  children: any;
  size?: 'sm' | 'md' | 'xs';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outlined' | 'tertiary' | 'ghost' | 'icon';
  type?: 'button' | 'submit' | 'reset';
  to?: string;
  target?: string;
  rel?: string;
}

function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  to,
  target,
  rel,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-brand-gray hover:bg-[#d0d2d0] active:bg-[#c5c7c5]',
    secondary: 'bg-gray-100 hover:bg-gray-300 active:bg-gray-400',
    tertiary: 'bg-[#c6d1d7] hover:bg-gray-100 active:bg-gray-200',
    outlined: 'bg-transparent hover:bg-black/10 active:bg-black/20 border-1 border-black',
    ghost: 'border-0 bg-transparent hover:bg-black/10 active:bg-black/20',
    icon: 'flex-shrink-0 !py-1 !px-1 border-0 !h-auto',
  } as const;

  const sizeClasses = {
    xs: 'text-xs py-1 px-2 h-[24px]',
    sm: 'text-sm py-1 px-2 h-[28px]',
    md: 'text-sm py-2 px-4 h-[42px]',
  } as const;

  const baseClasses =
    'text-black cursor-pointer border-1 border-black disabled:opacity-80 disabled:cursor-not-allowed disabled:text-gray-400 outline-none transition-colors duration-200';

  const linkDisabledClasses = disabled ? 'pointer-events-none opacity-80 text-gray-400' : '';

  const composed = twMerge(
    clsx(baseClasses, variantClasses[variant], sizeClasses[size], linkDisabledClasses, className),
  );

  if (to) {
    return (
      <Link href={to} className={composed} target={target} rel={rel} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={composed} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export default Button;
