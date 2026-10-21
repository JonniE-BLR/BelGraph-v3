import { useEffect, useMemo, useRef } from 'react';
import { ChevronRight, ExternalLink, Landmark, MapPin, Network, Quote, ScrollText, Sparkles, X } from 'lucide-react';
import type { GraphEdge, GraphNode } from '@/types';
import { CATS, YEAR_FROM, YEAR_TO } from '@/data/categories';
import { initials, yearsStr } from '@/lib/utils';

interface Props {
  node: GraphNode | null;
  edges: GraphEdge[];
  photoTick: number;
  onClose: () => void;
  onJump: (id: string) => void;
}

export function PersonPanel({ node, edges, onClose, onJump }: Props) {
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0; }, [node]);

  const conns = useMemo(() => {
    if (!node) return [];
    return edges
      .filter((e) => e.s === node || e.t === node)
      .map((e) => ({ o: e.s === node ? e.t : e.s, l: e.l }))
      .sort((a, b) => a.o.b - b.o.b);
  }, [node, edges]);

  const n = node;
  const cat = n ? CATS[n.c] : null;
  const span = YEAR_TO - YEAR_FROM;
  const l = n ? ((n.b - YEAR_FROM) / span) * 100 : 0;
  const ri = n ? (((n.d || YEAR_TO) - YEAR_FROM) / span) * 100 : 0;
  const lifespan = n ? (n.d || YEAR_TO) - n.b : 0;

  return (
    <aside className={`panel glass fixed z-40 rounded-3xl overflow-hidden flex flex-col ${n ? '' : 'hid'}`}>
      {n && cat && (
        <div ref={scroll} className="pc-scroll overflow-y-auto flex-1">
          <div className="p-6 relative">
            <button onClick={onClose} className="absolute right-4 top-4 icobtn !rounded-full bg-white/6">
              <X className="w-4 h-4" />
            </button>

            {/* шапка */}
            <div className="flex items-center gap-4 pr-8">
              <div className="w-[88px] h-[88px] rounded-full overflow-hidden shrink-0" style={{ boxShadow: `0 0 0 3px ${cat.color}66, 0 0 30px ${cat.color}33` }}>
                {n.photo
                  ? <img src={n.photo} className="w-full h-full object-cover" alt={n.n} />
                  : <div className="w-full h-full grid place-items-center font-display font-bold text-2xl bg-white/4" style={{ color: cat.color }}>{initials(n)}</div>}
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-[19px] leading-tight">{n.n}</div>
                <div className="text-[12px] opacity-75 mt-1">{n.role}</div>
                <div className="text-xs opacity-55 mt-0.5">{yearsStr(n)} · {lifespan} {n.d ? 'лет жизни' : 'лет'}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.14em] px-2.5 py-1 rounded-full" style={{ background: cat.color + '22', color: cat.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />{cat.name}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[12px] opacity-70">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color }} />
              <span>Родом из: <b className="opacity-100 text-white/90">{n.place}</b></span>
            </div>

            {/* цитата */}
            {n.q && (
              <div className="mt-5 relative rounded-2xl p-4 bg-white/4" style={{ borderLeft: `3px solid ${cat.color}` }}>
                <Quote className="w-4 h-4 absolute right-3 top-3 opacity-20" />
                <div className="text-[13px] leading-relaxed italic opacity-90 pr-5">«{n.q}»</div>
              </div>
            )}

            {/* биография */}
            <Section icon={<ScrollText className="w-3.5 h-3.5" />} title="Биография">
              <p className="text-[13px] leading-relaxed opacity-85">{n.bio}</p>
            </Section>

            {/* факты */}
            <Section icon={<Sparkles className="w-3.5 h-3.5" />} title="Почему важная фигура">
              {n.f.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed opacity-85 py-1">
                  <span className="fact-dot" style={{ background: cat.color }} />
                  <span>{f}</span>
                </div>
              ))}
            </Section>

            {/* наследие */}
            <Section icon={<Landmark className="w-3.5 h-3.5" />} title="Наследие и память">
              <p className="text-[13px] leading-relaxed opacity-85">{n.legacy}</p>
            </Section>

            {/* лента веков */}
            <Section title="Жизнь на ленте веков">
              <div className="relative h-8 rounded-xl overflow-hidden bg-white/5">
                <div className="absolute top-1/2 -translate-y-1/2 h-[5px] rounded-full" style={{ left: `${l}%`, width: `${Math.max(1.5, ri - l)}%`, background: `linear-gradient(90deg, ${cat.color}aa, ${cat.color})` }} />
                <span className="absolute text-[9px] opacity-40 left-2 top-1">{YEAR_FROM}</span>
                <span className="absolute text-[9px] opacity-40 right-2 top-1">{YEAR_TO}</span>
                {!n.d && <span className="absolute text-[8px] right-1.5 bottom-1 font-bold" style={{ color: cat.color }}>жив(а)</span>}
              </div>
            </Section>

            {/* связи */}
            <Section icon={<Network className="w-3.5 h-3.5" />} title={`Связи · ${conns.length}`}>
              {conns.map((c) => (
                <button key={c.o.i} onClick={() => onJump(c.o.i)} className="conn-row w-full text-left flex items-center gap-3 p-2 rounded-xl">
                  <span className="w-9 h-9 rounded-full overflow-hidden grid place-items-center text-[10px] font-bold shrink-0" style={{ background: CATS[c.o.c].color + '1f', color: CATS[c.o.c].color, boxShadow: `inset 0 0 0 1.5px ${CATS[c.o.c].color}` }}>
                    {c.o.photo ? <img src={c.o.photo} alt="" className="w-full h-full object-cover" /> : initials(c.o)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{c.o.n}</span>
                    <span className="block text-[11px] opacity-50 truncate">{c.l} · {c.o.b}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-30 shrink-0" />
                </button>
              ))}
            </Section>

            {n.wikiUrl
              ? <a href={n.wikiUrl} target="_blank" rel="noopener noreferrer" className="mt-4 mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold opacity-60 hover:opacity-100 transition" style={{ color: cat.color }}><ExternalLink className="w-3.5 h-3.5" />Читать в Википедии</a>
              : <div className="mt-4 mb-1 text-[10px] opacity-30">фото и ссылка загружаются из Википедии…</div>}
          </div>
        </div>
      )}
    </aside>
  );
}

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-[10px] uppercase tracking-[.2em] opacity-45 mb-2 flex items-center gap-1.5">{icon}{title}</div>
      {children}
    </div>
  );
}
