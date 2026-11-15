import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[120px] w-full rounded-xl border border-border-soft bg-white px-4 py-4 text-sm text-navy shadow-xs transition-colors placeholder:text-body-text/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:border-tech-blue disabled:cursor-not-allowed disabled:opacity-50 box-border touch-target",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = "Textarea";

export { Textarea };
