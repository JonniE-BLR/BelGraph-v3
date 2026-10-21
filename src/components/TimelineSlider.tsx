import { YEAR_TO, eraName } from '@/data/categories';

interface Props {
  year: number;
  onYear: (y: number) => void;
}

export function TimelineSlider({ year, onYear }: Props) {
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-30 glass rounded-2xl px-5 py-3 w-[min(560px,92vw)] pointer-events-auto fade-in">
      <div className="flex items-end justify-between mb-1.5">
        <div>
          <div className="text-[10px] uppercase tracking-[.2em] opacity-50">Год</div>
          <div className="font-display font-bold text-2xl leading-none text-gold">{year}</div>
        </div>
        <div className="text-right text-xs font-semibold tracking-wide opacity-80">{eraName(year)}</div>
      </div>
      <input
        type="range" min={1030} max={YEAR_TO} step={1} value={year}
        onChange={(e) => onYear(+e.target.value)}
        className="w-full"
      />
      <div className="flex justify-between text-[9px] opacity-35 mt-1">
        <span>1030</span><span>1400</span><span>1700</span><span>{YEAR_TO}</span>
      </div>
    </div>
  );
}
