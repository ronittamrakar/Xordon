import React from 'react';
import { cn } from '@/lib/utils';

type BrandWordmarkProps = {
  className?: string;
  textClassName?: string;
  casing?: 'lower' | 'title';
  style?: React.CSSProperties;
};

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({
  className,
  textClassName,
  casing = 'lower',
  style,
}) => {

  return (
    <div
      className={cn("flex items-center gap-1 select-none", className)}
      aria-label="Xordon"
      style={style}
    >
      <img
        src="/logo-icon.png"
        alt="Xordon Logo"
        className="h-[0.85em] w-auto object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
      />
      <span className={cn(
        "brand-wordmark leading-none",
        casing === 'lower' ? "lowercase" : "capitalize",
        textClassName
      )}>
        Xordon
      </span>
    </div>
  );
};
