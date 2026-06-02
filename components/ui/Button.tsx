"use client";

import React from "react";

// =========================
// TYPES
// =========================

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "success" | "warning" | "ghost";

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

type ButtonWidth = "full" | "auto";

interface ButtonProps {
  children: React.ReactNode;

  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: ButtonWidth;

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  isLoading?: boolean;
  disabled?: boolean;

  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";

  className?: string;

  ariaLabel?: string;

  href?: string;
}

// =========================
// LOADING SPINNER
// =========================

const LoadingSpinner = () => {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />

      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 
        0 0 5.373 0 12h4zm2 
        5.291A7.962 7.962 0 
        014 12H0c0 3.042 1.135 
        5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// =========================
// BUTTON COMPONENT
// =========================

const Button = ({ children, variant = "primary", size = "md", width = "auto", leftIcon, rightIcon, isLoading = false, disabled = false, onClick, type = "button", className = "", ariaLabel, href }: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#FFA81C] text-black hover:bg-[#E68E00] focus:ring-[#AA6D0B]",

    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",

    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",

    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",

    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",

    warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500",

    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
  };

  const sizes = {
    xs: "px-2 py-1 text-xs gap-1",
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-5 py-2.5 text-lg gap-2",
    xl: "px-6 py-3 text-xl gap-3",
  };

  const widths = {
    full: "w-full",
    auto: "w-auto",
  };

  const combinedClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${widths[width]}
    ${className}
  `;

  const computedAriaLabel = ariaLabel || (typeof children === "string" ? children : "button");

  // =========================
  // LINK MODE
  // =========================

  if (href) {
    return (
      <a href={href} className={combinedClassName} aria-label={computedAriaLabel}>
        {isLoading && <LoadingSpinner />}

        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}

        <span>{children}</span>

        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </a>
    );
  }

  // =========================
  // BUTTON MODE
  // =========================

  return (
    <button type={type} onClick={onClick} disabled={disabled || isLoading} className={combinedClassName} aria-label={computedAriaLabel} aria-busy={isLoading}>
      {isLoading && <LoadingSpinner />}

      {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}

      <span>{children}</span>

      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
