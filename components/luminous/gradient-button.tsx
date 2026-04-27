"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 px-3 text-body-sm",
  md: "h-10 px-5 text-body-md",
  lg: "h-12 px-7 text-title-md",
};

export const GradientButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-on-molten shadow-[0_8px_24px_-8px_rgba(255,98,0,0.55)] transition-all hover:brightness-110 hover:shadow-[0_10px_28px_-6px_rgba(255,98,0,0.7)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
          sizes[size],
          className,
        )}
        style={{
          background: "linear-gradient(135deg, #ff8533 0%, #ff6200 100%)",
          color: "#0f1113",
        }}
      >
        {children}
      </button>
    );
  },
);
GradientButton.displayName = "GradientButton";
