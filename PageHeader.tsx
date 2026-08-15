export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-6 border-b border-ink-900/10">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] text-amber-600">
          {eyebrow}
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink-950 mt-1">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-ink-950/50 mt-1 max-w-xl">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
