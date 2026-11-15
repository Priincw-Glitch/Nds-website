import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 min-h-12 w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-navy shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-body-text/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:border-tech-blue disabled:cursor-not-allowed disabled:opacity-50 box-border touch-target",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
