import { useEffect, useState } from 'react';
import { Dices } from 'lucide-react';
import { YEAR_TO } from '@/data/categories';

interface Props {
  people: number;
  links: number;
  firstYear: number;
  onStart: () => void;
  onRandom: () => void;
}

function useCountUp(to: number, dur: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let t0: number | null = null, raf = 0;
    const s = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(s);
    };
    raf = requestAnimationFrame(s);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return v;
}

export function Splash({ people, links, firstYear, onStart, onRandom }: Props) {
  const [gone, setGone] = useState(false);
  const c1 = useCountUp(people, 1100), c2 = useCountUp(links, 1300), c3 = useCountUp(YEAR_TO - firstYear, 1500);

  const go = (fn: () => void) => { setGone(true); setTimeout(fn, 150); };

  return (
    <div className={`splash fixed inset-0 z-50 flex items-center justify-center ${gone ? 'gone' : ''}`}>
      <div className="text-center px-6 max-w-3xl">
        <div className="fade-word inline-flex items-center gap-2 text-[11px] uppercase tracking-[.3em] opacity-60 mb-6" style={{ animationDelay: '.05s' }}>
          <span className="w-8 h-px bg-white/30" /> интерактивная визуализация данных <span className="w-8 h-px bg-white/30" />
        </div>
        <h1 className="font-display font-black leading-[0.95] text-[13vw] sm:text-7xl md:text-8xl">
          <span className="fade-word block" style={{ animationDelay: '.15s' }}>СЕТКА</span>
          <span className="fade-word block text-gradient" style={{ animationDelay: '.3s' }}>ПАКАЛЕННЯЎ</span>
        </h1>
        <p className="fade-word mt-6 text-sm sm:text-base opacity-70 max-w-xl mx-auto leading-relaxed" style={{ animationDelay: '.45s' }}>
          Как связаны между собой Франциск Скорина, Янка Купала, Марк Шагал, Жорес Алфёров,
          Ольга Корбут и создатель World of Tanks? Исследуйте живой граф{' '}
          <b className="text-white">{people}</b> выдающихся людей белорусской земли — от XI века до наших дней.
        </p>
        <div className="fade-word mt-8 flex items-center justify-center gap-3 flex-wrap" style={{ animationDelay: '.6s' }}>
          <button onClick={() => go(onStart)} className="sheen font-display font-bold text-sm tracking-wide rounded-full px-8 py-3.5 text-[#14100a] transition-transform hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(120deg,#fbbf24,#f59e0b)' }}>
            ИССЛЕДОВАТЬ СЕТЬ
          </button>
          <button onClick={() => go(onRandom)} className="btn-ghost rounded-full px-6 py-3.5 text-sm font-semibold inline-flex items-center gap-2">
            <Dices className="w-4 h-4" />Мне повезёт
          </button>
        </div>
        <div className="fade-word mt-9 flex justify-center gap-6 sm:gap-10 text-center" style={{ animationDelay: '.75s' }}>
          <Stat v={c1} label="личностей" color="var(--gold)" />
          <Stat v={c2} label="связей" color="#7dd3fc" />
          <Stat v={c3} label="лет истории" color="#fda4af" />
        </div>
        <div className="fade-word mt-10 text-[10px] opacity-30 tracking-wide" style={{ animationDelay: '.9s' }}>
          Учебный проект · фото и ссылки — из открытых данных Википедии / Wikimedia Commons
        </div>
      </div>
    </div>
  );
}

function Stat({ v, label, color }: { v: number; label: string; color: string }) {
  return (
    <div>
      <div className="font-display font-bold text-xl" style={{ color }}>{v.toLocaleString('ru-RU')}</div>
      <div className="text-[10px] uppercase tracking-[.2em] opacity-40 mt-1">{label}</div>
    </div>
  );
}
