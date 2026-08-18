import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'olive' | 'yellow';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'bg-gradient-to-r from-[#5AA7A7] to-[#468C8C] text-[#FFFDF2] hover:from-[#468C8C] hover:to-[#387272] shadow-md shadow-[#5AA7A7]/25 border border-[#96D7C6]/40 active:scale-[0.98]',
    olive:
      'bg-gradient-to-r from-[#BAC94A] to-[#A3B235] text-[#1E3A1E] hover:from-[#A3B235] hover:to-[#8E9C28] shadow-md shadow-[#BAC94A]/25 border border-[#BAC94A]/60 active:scale-[0.98]',
    yellow:
      'bg-gradient-to-r from-[#E2D36B] to-[#BAC94A] text-[#1E3A1E] hover:from-[#D1C258] hover:to-[#A3B235] shadow-md shadow-[#E2D36B]/30 border border-[#E2D36B]/60 active:scale-[0.98]',
    secondary:
      'bg-[#96D7C6]/25 text-[#1E3A3A] border border-[#96D7C6]/50 hover:bg-[#96D7C6]/40 hover:text-[#0F2F2F]',
    outline:
      'border-2 border-[#5AA7A7] text-[#5AA7A7] hover:bg-[#5AA7A7]/10 hover:border-[#468C8C]',
    ghost:
      'text-[#5AA7A7] hover:text-[#1E3A3A] hover:bg-[#5AA7A7]/10',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white border border-rose-500 shadow-md shadow-rose-900/20',
    success:
      'bg-[#BAC94A] hover:bg-[#A3B235] text-[#1E3A1E] border border-[#BAC94A]/60 shadow-md shadow-[#BAC94A]/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2.5 rounded-full',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
