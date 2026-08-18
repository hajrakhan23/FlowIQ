import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#018ABE]/15 border border-[#97CADB]/10 ${className}`}
    />
  );
};
