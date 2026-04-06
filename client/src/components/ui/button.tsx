import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-brand-600 hover:bg-brand-500 text-white disabled:bg-brand-600/50",
      secondary: "bg-surface-800 hover:bg-surface-700 text-surface-100 border border-surface-700",
      danger: "bg-red-600 hover:bg-red-500 text-white disabled:bg-red-600/50",
      ghost: "hover:bg-surface-800 text-surface-300 hover:text-white",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "font-medium rounded-lg transition-colors disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
