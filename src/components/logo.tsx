import { Anchor } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="WealthDock">
      <span className="brand-mark" aria-hidden="true">
        <Anchor size={compact ? 18 : 22} strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className="brand-name">
          Wealth<span>Dock</span>
        </span>
      )}
    </div>
  );
}
