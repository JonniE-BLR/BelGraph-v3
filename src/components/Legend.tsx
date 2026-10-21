import { useMemo } from 'react';
import type { CategoryId, GraphNode } from '@/types';
import { CATS, LANES } from '@/data/categories';

interface Props {
  nodes: GraphNode[];
  filter: CategoryId | null;
  onFilter: (c: CategoryId | null) => void;
}

export function Legend({ nodes, filter, onFilter }: Props) {
  const counts = useMemo(() => {
    const m = {} as Record<CategoryId, number>;
    nodes.forEach((n) => (m[n.c] = (m[n.c] || 0) + 1));
    return m;
  }, [nodes]);

  return (
    <aside className="fixed left-4 bottom-4 z-30 glass rounded-2xl p-2 w-[236px] fade-in hidden md:block">
      <div className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-[.2em] opacity-50 flex justify-between items-center">
        <span>Сферы</span>
        <span className="normal-case tracking-normal">{nodes.length} личностей</span>
      </div>
      {LANES.map((c) => (
        <button
          key={c}
          onClick={() => onFilter(filter === c ? null : c)}
          className={`lgrow ${filter && filter !== c ? 'off' : ''}`}
        >
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATS[c].color, boxShadow: `0 0 8px ${CATS[c].color}66` }} />
          <span className="text-[12px] font-medium flex-1 text-left">{CATS[c].name}</span>
          <span className="text-[11px] opacity-40">{counts[c]}</span>
        </button>
      ))}
      <div className="px-2 pt-1.5 pb-1 text-[10px] opacity-35">клик — выделить сферу</div>
    </aside>
  );
}
