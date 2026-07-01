export function SkeletonCard({ delay = 0 }: { delay?: number }) {
  const style = { '--sk-delay': `${delay}ms` } as React.CSSProperties;

  return (
    <div className="skeleton-card" style={style} aria-hidden="true">
      <div className="sk sk-circle" />
      <div className="sk-body">
        <div className="sk-topline">
          <div className="sk sk-chip" />
          <div className="sk sk-chip sk-chip-sm" />
          <div className="sk sk-chip sk-chip-ts" />
        </div>
        <div className="sk sk-text-lg" />
        <div className="sk sk-text-sm" style={{ width: '62%' }} />
        <div className="sk-route">
          <div className="sk sk-chip sk-chip-addr" />
          <div className="sk sk-arrow" />
          <div className="sk sk-chip sk-chip-addr" />
        </div>
      </div>
      <div className="sk-amount">
        <div className="sk sk-amount-num" />
        <div className="sk sk-chip sk-chip-sym" />
      </div>
      <div className="sk sk-expand" />
    </div>
  );
}
