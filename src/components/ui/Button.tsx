import { JSX } from 'preact';
import clsx from 'clsx';

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  children: any;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  const variantClasses = {
    primary: 'bg-[#dbdddb] hover:bg-[#d0d2d0] active:bg-[#c5c7c5]',
    secondary: 'bg-gray-100 hover:bg-gray-300 active:bg-gray-400',
  };

  const baseClasses =
    'cursor-pointer py-2 px-4 border-1 border-black disabled:opacity-80 disabled:cursor-not-allowed disabled:text-gray-400 outline-none h-[42px] transition-colors duration-200';

  return (
    <button
      type="button"
      className={clsx(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
