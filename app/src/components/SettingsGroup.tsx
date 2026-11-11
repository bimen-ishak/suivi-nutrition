import type { ReactNode } from 'react';

export function SettingsGroup({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="settings-group" open={open}>
      <summary>{title}</summary>
      <div className="settings-group-content">{children}</div>
    </details>
  );
}
