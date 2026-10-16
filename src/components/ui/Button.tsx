import * as React from "react"
import { cn } from "@/lib/utils"
import { Button as ButtonPrimitive } from "@/components/ui/primitives/button"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  /** Render the single child element (e.g. a `<Link>`) with button styling instead of a `<button>`. */
  asChild?: boolean;
}

/** CRM look (pill shape, heading font, CSS-variable colours) layered on the shadcn/ui button primitive. */
const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm",
  secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] shadow-sm",
  outline: "border border-[var(--border)] bg-transparent hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
  ghost: "bg-transparent hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
  destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 rounded-full px-3 text-xs",
  lg: "h-11 rounded-full px-8",
  icon: "h-9 w-9 rounded-full",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => (
    <ButtonPrimitive
      ref={ref}
      asChild={asChild}
      // The primitive's own variant/size classes are replaced by the CRM ones below.
      variant={null}
      size={null}
      data-variant={variant}
      data-size={size}
      className={cn(
        "shrink gap-0 rounded-full text-sm font-semibold font-heading transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button }
