import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref): JSX.Element => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 font-medium",
          variant === "outline" && "border border-gray-300 bg-transparent shadow-sm hover:bg-gray-100",
          variant === "ghost" && "hover:bg-gray-100",
          variant === "default" && "bg-gray-900 text-gray-50 shadow hover:bg-gray-700",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
