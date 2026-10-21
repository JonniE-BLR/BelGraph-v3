import type { Category, CategoryId, Era } from '@/types';

export const CATS: Record<CategoryId, Category> = {
  enlight: { name: 'Просвещение', color: '#c4b5fd' },
  hist: { name: 'Государство и история', color: '#6ee7b7' },
  lit: { name: 'Литература', color: '#fcd34d' },
  sci: { name: 'Наука', color: '#7dd3fc' },
  art: { name: 'Искусство и музыка', color: '#fda4af' },
  sport: { name: 'Спорт', color: '#fdba74' },
  it: { name: 'IT и современность', color: '#bef264' },
};

export const LANES: CategoryId[] = ['enlight', 'hist', 'lit', 'sci', 'art', 'sport', 'it'];

export const YEAR_FROM = 1050;
export const YEAR_TO = 2026;

export const ERAS: Era[] = [
  { from: 1050, to: 1569, name: 'Полоцкое княжество · ВКЛ', color: 'rgba(196,181,253,.055)' },
  { from: 1569, to: 1795, name: 'Речь Посполитая', color: 'rgba(110,231,183,.05)' },
  { from: 1795, to: 1918, name: 'Российская империя', color: 'rgba(125,211,252,.05)' },
  { from: 1918, to: 1991, name: 'БНР · БССР', color: 'rgba(253,164,175,.055)' },
  { from: 1991, to: 2026, name: 'Республика Беларусь', color: 'rgba(190,242,100,.055)' },
];

export function eraName(y: number): string {
  for (const e of ERAS) if (y >= e.from && y < e.to) return e.name;
  return '';
}
