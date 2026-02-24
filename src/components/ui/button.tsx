import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#1A365D] to-[#2B6CB0] text-white shadow-md hover:shadow-lg hover:brightness-110",
        destructive:
          "bg-gradient-to-r from-[#C53030] to-[#E53E3E] text-white shadow-sm hover:shadow-md hover:brightness-110",
        outline:
          "border border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:text-[#1A365D] hover:border-gray-300",
        secondary:
          "bg-gray-100 text-[#1A202C] shadow-sm hover:bg-gray-200",
        ghost:
          "hover:bg-[#2B6CB0]/5 hover:text-[#1A202C]",
        link:
          "text-[#2B6CB0] underline-offset-4 hover:underline",
        glow:
          "bg-gradient-to-r from-[#1A365D] to-[#2B6CB0] text-white shadow-md hover:shadow-[0_0_20px_rgba(43,108,176,0.4)] hover:brightness-110",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-10 rounded-xl px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
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
export type { ButtonProps };
