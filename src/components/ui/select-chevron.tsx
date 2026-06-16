import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

export function SelectChevron({
  open,
  hideOnHover,
  className,
}: {
  open?: boolean;
  hideOnHover?: boolean;
  className?: string;
}) {
  return (
    <ChevronDown
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-transform",
        hideOnHover && "group-hover:opacity-0",
        open && "rotate-180",
        className,
      )}
    />
  );
}
