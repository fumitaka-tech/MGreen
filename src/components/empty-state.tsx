import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/50 p-6 text-center sm:p-8">
      <p className="text-lg font-medium text-green-800">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-green-600">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
