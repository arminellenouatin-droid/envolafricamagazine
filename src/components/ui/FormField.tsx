import React, { forwardRef, useId } from "react";

export interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField(
    {
      label,
      helperText,
      error,
      required = false,
      leftAddon,
      rightAddon,
      id: customId,
      className = "",
      disabled = false,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);

    return (
      <div className="w-full space-y-1.5 text-left">
        <label
          htmlFor={inputId}
          className="block text-xs font-bold uppercase tracking-wider text-[#2b2525] dark:text-zinc-200"
        >
          {label}
          {required && <span className="ml-1 text-[#9e001f]">*</span>}
        </label>

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3.5 z-10 flex items-center text-[#594c4a] pointer-events-none">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={`w-full min-h-[44px] rounded-[10px] border px-4 py-2 text-sm transition font-sans placeholder:text-[#594c4a]/50 dark:placeholder:text-zinc-500
              ${leftAddon ? "pl-11" : ""}
              ${rightAddon ? "pr-11" : ""}
              ${
                hasError
                  ? "border-[#ba1a1a] bg-red-50/20 text-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a] focus:outline-none"
                  : "border-[#d8c3c1] bg-white text-[#1b1c1c] focus:border-[#9e001f] focus:ring-2 focus:ring-[#9e001f]/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              }
              ${disabled ? "cursor-not-allowed opacity-50 bg-zinc-100 dark:bg-zinc-900" : ""}
              ${className}
            `.trim()}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-3.5 z-10 flex items-center text-[#594c4a]">
              {rightAddon}
            </div>
          )}
        </div>

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#ba1a1a] animate-in fade-in duration-150"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </p>
        )}

        {!hasError && helperText && (
          <p id={helperId} className="text-xs text-[#594c4a] dark:text-zinc-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

export default FormField;
