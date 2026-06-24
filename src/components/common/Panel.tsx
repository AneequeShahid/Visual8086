import React, { ReactNode } from 'react';

interface PanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

export function Panel({ title, icon, children, className = '', headerRight }: PanelProps) {
  return (
    <div className={`bento-panel flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[#1c1f2e]">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[var(--color-brand-teal)]">{icon}</span>}
          <h2 className="text-sm font-semibold tracking-wide text-gray-200 uppercase">{title}</h2>
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>
      <div className="flex-1 overflow-auto bg-[#131520] relative">
        {children}
      </div>
    </div>
  );
}
