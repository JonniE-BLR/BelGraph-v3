import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import type { GraphNode } from '@/types';
import { CATS } from '@/data/categories';

interface Props {
  nodes: GraphNode[];
  onPick: (id: string) => void;
}

export function SearchBox({ nodes, onPick }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (!v) return [];
    return nodes
      .filter((n) => n.n.toLowerCase().includes(v) || n.role.toLowerCase().includes(v) || n.place.toLowerCase().includes(v))
      .slice(0, 8);
  }, [q, nodes]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const pick = (id: string) => { onPick(id); setQ(''); setOpen(false); };

  return (
    <div ref={wrap} className="glass pointer-events-auto relative rounded-2xl flex items-center gap-2 pl-3 pr-1 py-1 min-w-[210px] flex-1 max-w-[340px]">
      <Search className="w-4 h-4 opacity-50 shrink-0" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) pick(matches[0].i); }}
        autoComplete="off"
        placeholder="Имя, роль или город…"
        className="bg-transparent outline-none text-sm py-1.5 w-full placeholder:text-white/30"
      />
      {open && q.trim() && (
        <div className="glass absolute top-[110%] left-0 right-0 rounded-xl overflow-hidden z-40">
          {matches.length ? matches.map((n) => (
            <button key={n.i} onClick={() => pick(n.i)} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-white/8 transition">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATS[n.c].color }} />
              <span className="min-w-0">
                <span className="block truncate">{n.n}</span>
                <span className="block text-[10px] opacity-45 truncate">{n.role}</span>
              </span>
              <span className="ml-auto text-[10px] opacity-40 shrink-0">{n.a ? 'ок. ' : ''}{n.b}</span>
            </button>
          )) : <div className="px-4 py-3 text-xs opacity-50">ничего не найдено…</div>}
        </div>
      )}
    </div>
  );
}
