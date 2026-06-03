import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("page-header", className)}>
      <div>
        <h1 className="page-title">{title}</h1>
        {description ? <div className="mt-2 text-small text-text-muted">{description}</div> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  );
}

export function PageActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-actions", className)}>
      {children}
    </div>
  );
}
