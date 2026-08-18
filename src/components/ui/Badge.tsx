import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'glass' | 'olive' | 'teal' | 'yellow';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const styles = {
    default: 'bg-[#5AA7A7]/15 text-[#2D6A6A] border-[#5AA7A7]/30',
    teal: 'bg-[#5AA7A7]/20 text-[#1E3A3A] border-[#5AA7A7]/40 font-bold',
    olive: 'bg-[#BAC94A]/25 text-[#4A5910] border-[#BAC94A]/50 font-bold',
    yellow: 'bg-[#E2D36B]/30 text-[#6B5F08] border-[#E2D36B]/60 font-bold',
    success: 'bg-[#BAC94A]/25 text-[#445508] border-[#BAC94A]/50 font-bold',
    warning: 'bg-[#E2D36B]/30 text-[#736307] border-[#E2D36B]/60 font-bold',
    danger: 'bg-rose-500/15 text-rose-700 border-rose-500/30 font-bold',
    info: 'bg-[#6C8CBF]/20 text-[#3B5B8E] border-[#6C8CBF]/40 font-bold',
    glass: 'bg-white/70 text-[#1E3A3A] border-[#96D7C6]/40 backdrop-blur-md shadow-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
