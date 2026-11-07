import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  isLoading = false,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full space-y-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-14 w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#ead8d5] dark:border-zinc-800 bg-[#fcf9f8] dark:bg-zinc-900/40 p-8 sm:p-12 text-center">
        {emptyState?.icon && (
          <div className="mb-3 text-[#9e001f] dark:text-red-400">
            {emptyState.icon}
          </div>
        )}
        <h4 className="font-serif text-lg font-bold text-[#2b2525] dark:text-zinc-100">
          {emptyState?.title || "Aucune donnée disponible"}
        </h4>
        {emptyState?.description && (
          <p className="mt-1 text-sm text-[#594c4a] dark:text-zinc-400 max-w-sm">
            {emptyState.description}
          </p>
        )}
        {emptyState?.action && (
          <div className="mt-4">{emptyState.action}</div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 1. Affichage Mobile (< 768px) : Cartes tactiles empilées sans débordement horizontal */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className="rounded-2xl border border-[#ead8d5] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs space-y-2.5"
          >
            {columns.map((col) => {
              const content = col.render
                ? col.render(item)
                : ((item as any)[col.key] as React.ReactNode);
              return (
                <div
                  key={col.key}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-bold text-[#594c4a] dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                    {col.header}
                  </span>
                  <div className="text-right font-medium text-[#2b2525] dark:text-zinc-100">
                    {content}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 2. Affichage Desktop (>= 768px) : Tableau classique élégant */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-[#ead8d5] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#ead8d5] dark:border-zinc-800 bg-[#fcf9f8] dark:bg-zinc-900/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#594c4a] dark:text-zinc-400 ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  } ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0dedd] dark:divide-zinc-800 text-sm">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="transition-colors hover:bg-[#fff7f6] dark:hover:bg-zinc-800/40"
              >
                {columns.map((col) => {
                  const content = col.render
                    ? col.render(item)
                    : ((item as any)[col.key] as React.ReactNode);
                  return (
                    <td
                      key={col.key}
                      className={`px-5 py-3.5 text-[#2b2525] dark:text-zinc-200 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      } ${col.className || ""}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
