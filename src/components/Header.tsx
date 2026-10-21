import { CalendarRange, Dices, Hand, Mouse, MousePointerClick, Network, Waypoints } from 'lucide-react';
import type { ViewMode } from '@/types';
import { SearchBox } from './SearchBox';
import type { GraphNode } from '@/types';

interface Props {
  mode: ViewMode;
  nodes: GraphNode[];
  onMode: (m: ViewMode) => void;
  onRandom: () => void;
  onPick: (id: string) => void;
}

export function Header({ mode, nodes, onMode, onRandom, onPick }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-3 sm:px-5 pt-3 pointer-events-none">
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="glass pointer-events-auto flex items-center gap-2.5 rounded-2xl px-3.5 py-2">
          <Network className="w-5 h-5 text-gold" />
          <div className="leading-tight">
            <div className="font-display font-bold text-[13px] tracking-wide">СЕТКА ПАКАЛЕННЯЎ</div>
            <div className="text-[10px] uppercase tracking-[.18em] opacity-50 hidden sm:block">
              просвещение · история · наука · культура · спорт · IT
            </div>
          </div>
        </div>

        <SearchBox nodes={nodes} onPick={onPick} />

        <div className="pointer-events-auto seg">
          <button className={mode === 'graph' ? 'on' : ''} onClick={() => onMode('graph')}>
            <span className="inline-flex items-center gap-1.5"><Waypoints className="w-3.5 h-3.5" />Граф</span>
          </button>
          <button className={mode === 'tl' ? 'on' : ''} onClick={() => onMode('tl')}>
            <span className="inline-flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" />Лента времени</span>
          </button>
        </div>

        <button className="glass pointer-events-auto icobtn !rounded-2xl" title="Случайная личность" onClick={onRandom}>
          <Dices className="w-[18px] h-[18px]" />
        </button>

        <div className="ml-auto hidden xl:flex pointer-events-none text-[11px] uppercase tracking-[.15em] opacity-40 items-center gap-4">
          <span className="inline-flex items-center gap-1.5"><Mouse className="w-3.5 h-3.5" />колесо — масштаб</span>
          <span className="inline-flex items-center gap-1.5"><Hand className="w-3.5 h-3.5" />перетаскивайте узлы</span>
          <span className="inline-flex items-center gap-1.5"><MousePointerClick className="w-3.5 h-3.5" />клик — досье</span>
        </div>
      </div>
    </header>
  );
}
