import React from "react";

export type BadgeVariant =
  | "brand"
  | "gold"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  icon,
  className = "",
  ...props
}: BadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const variantClasses: Record<BadgeVariant, string> = {
    brand:
      "bg-[#fff1f2] text-[#9e001f] border border-[#fecdd3] dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60",
    gold:
      "bg-[#fff9e6] text-[#845e00] border border-[#fef08a] dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900/60",
    success:
      "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
    warning:
      "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
    error:
      "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60",
    info:
      "bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60",
    neutral:
      "bg-zinc-100 text-[#594c4a] border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  };

  return (
    <span
      className={`inline-flex items-center font-bold font-sans rounded-full uppercase tracking-wider select-none shrink-0 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
