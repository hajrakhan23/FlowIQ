import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  dark?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = false,
  glow = false,
  dark = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${
        dark
          ? 'bg-[#1E3A3A]/90 border border-[#96D7C6]/25 text-white backdrop-blur-md shadow-lg shadow-[#1E3A3A]/10'
          : 'bg-white/90 border border-[#96D7C6]/40 text-[#1E3A3A] backdrop-blur-md shadow-md shadow-[#5AA7A7]/05'
      } p-6 ${
        hover
          ? dark
            ? 'hover:bg-[#1E3A3A] hover:border-[#96D7C6]/50 hover:-translate-y-0.5 hover:shadow-xl'
            : 'hover:bg-white hover:border-[#5AA7A7]/60 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#5AA7A7]/12'
          : ''
      } ${
        glow
          ? dark
            ? 'shadow-lg shadow-[#5AA7A7]/30 border-[#5AA7A7]'
            : 'shadow-lg shadow-[#5AA7A7]/20 border-[#5AA7A7]/70'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
