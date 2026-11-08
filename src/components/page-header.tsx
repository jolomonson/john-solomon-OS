export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ComingInPhase({ phase, children }: { phase: number; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Phase {phase}.</span> {children}
    </div>
  );
}
