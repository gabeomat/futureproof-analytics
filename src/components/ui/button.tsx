import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-mono text-xs font-bold uppercase tracking-wider ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-3 border-ink shadow-memphis-sm hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-memphis active:translate-x-0 active:translate-y-0 active:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-forest text-cream hover:bg-forest",
        destructive: "bg-terra text-cream hover:bg-terra",
        outline: "bg-cream text-ink hover:bg-linen",
        secondary: "bg-linen text-ink hover:bg-linen",
        ghost: "border-transparent shadow-none hover:bg-linen hover:border-ink hover:shadow-memphis-sm",
        link: "border-transparent shadow-none text-forest underline-offset-4 hover:underline hover:translate-x-0 hover:translate-y-0",
        accent: "bg-salmon text-ink hover:bg-salmon",
        sage: "bg-sage text-ink hover:bg-sage",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
