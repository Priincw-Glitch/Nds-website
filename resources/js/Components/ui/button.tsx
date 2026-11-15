import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98] active:transition-transform",
    {
        variants: {
            variant: {
                primary:
                    "border border-transparent bg-tech-blue text-white hover:bg-tech-blue-hover hover:border-white/20",
                primaryOnDark:
                    "border border-transparent bg-tech-blue text-white hover:bg-tech-blue-hover hover:border-white/20",
                navy:
                    "bg-navy text-white border border-transparent hover:bg-navy/85 hover:border-navy/40 hover:backdrop-blur-sm",
                secondary:
                    "border border-border-soft bg-transparent text-navy hover:bg-tech-blue/8 hover:border-border-strong",
                outline:
                    "border border-border-soft bg-transparent text-navy hover:bg-tech-blue/8 hover:border-border-strong",
                outlineLight:
                    "border border-white/25 bg-white/5 text-white hover:border-electric-light/50 hover:bg-electric-light/10 backdrop-blur-xs",
                ghost:
                    "bg-transparent text-body-text hover:bg-tech-blue/8 hover:text-tech-blue-hover",
                link:
                    "text-tech-blue underline-offset-4 hover:underline p-0 h-auto font-medium",
            },
            size: {
                default: "h-11 px-5 py-2 min-w-[88px] touch-target",
                sm: "h-10 rounded-md px-4 text-xs min-w-[72px] touch-target",
                lg: "h-12 rounded-lg px-7 text-base min-w-[104px] touch-target",
                icon: "h-11 w-11 p-0 touch-target",
                iconSm: "h-10 w-10 p-0 rounded-md touch-target",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };