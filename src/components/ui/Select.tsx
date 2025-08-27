import clsx from 'clsx';
import { JSX } from 'preact';

interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  children: any;
  className?: string;
}

function Select({ children, className = '', ...props }: SelectProps) {
  return (
    <div className={clsx('px-2 bg-[#dbdddb] border-1 border-black h-[42px]', className)}>
      <select
        className="outline-none disabled:opacity-80 disabled:cursor-not-allowed disabled:text-gray-400 p-2 w-full h-[42px]"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export default Select;
