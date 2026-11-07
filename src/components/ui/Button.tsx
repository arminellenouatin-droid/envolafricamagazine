import React, { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled = false,
    className = "",
    type = "button",
    ...props
  },
  ref
) {
  // Styles de base : touch target >= 44px, focus visible, transition fluide
  const baseClasses =
    "inline-flex items-center justify-center font-display font-bold select-none cursor-pointer " +
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100";

  // Tailles (hauteur, padding, taille de police, rayon)
  const sizeClasses: Record<ButtonSize, string> = {
    sm: "min-h-[36px] min-w-[36px] px-3.5 py-1.5 text-xs rounded-full gap-1.5",
    md: "min-h-[44px] min-w-[44px] px-5 py-2.5 text-sm rounded-full gap-2",
    lg: "min-h-[52px] min-w-[52px] px-7 py-3.5 text-base rounded-full gap-2.5",
  };

  // Variantes
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-[#9e001f] text-white hover:bg-[#7f0019] shadow-sm hover:shadow " +
      "focus-visible:ring-[#9e001f] focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
    secondary:
      "bg-white text-[#2b2525] border border-[#d8c3c1] hover:bg-[#fff7f6] hover:border-[#9e001f] " +
      "focus-visible:ring-[#9e001f] dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700",
    ghost:
      "bg-transparent text-[#2b2525] hover:bg-[#fff1f2] hover:text-[#9e001f] " +
      "focus-visible:ring-[#9e001f] dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-red-400",
    danger:
      "bg-[#ba1a1a] text-white hover:bg-[#93000a] shadow-sm " +
      "focus-visible:ring-red-600 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
    gold:
      "bg-[#D4AF37] text-[#1b1c1c] hover:bg-[#c49d27] font-extrabold shadow-sm hover:shadow " +
      "focus-visible:ring-[#D4AF37] focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Chargement...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

export default Button;
