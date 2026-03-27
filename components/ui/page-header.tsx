import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cx } from "@/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  compact?: boolean;
  backHref?: string;
};

export function PageHeader({ title, subtitle, actions, compact = false, backHref }: PageHeaderProps) {
  return (
    <header className={cx("page-header", compact && "page-header-compact")}>
      <div className="page-header-copy">
        {backHref ? (
          <Link href={backHref} className="back-link">
            <ChevronLeft size={16} />
            <span>Back</span>
          </Link>
        ) : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}
