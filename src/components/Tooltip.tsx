import type { HoverState } from '@/hooks/useGraphEngine';
import { CATS } from '@/data/categories';
import { yearsStr } from '@/lib/utils';

export function Tooltip({ hover }: { hover: HoverState | null }) {
  if (!hover) return null;
  const n = hover.node;
  const left = Math.min(hover.x + 16, window.innerWidth - 260);
  const top = Math.min(hover.y + 16, window.innerHeight - 100);
  return (
    <div className="fixed z-40 glass rounded-xl px-3 py-2 text-xs pointer-events-none max-w-[250px]" style={{ left, top }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATS[n.c].color }} />
        <b>{n.n}</b>
      </div>
      <div className="opacity-70 mt-0.5">{n.role}</div>
      <div className="opacity-50 mt-0.5">{yearsStr(n)} · {CATS[n.c].name}</div>
    </div>
  );
}
