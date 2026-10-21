import type { Person } from '@/types';

export const PI2 = Math.PI * 2;
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function hash(s: string): number {
  let h = 9;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(p: Pick<Person, 'n'>): string {
  const caps = p.n
    .replace(/[^А-Яа-яЁёA-Za-z .-]/g, '')
    .split(/\s+/)
    .map((w) => (w.match(/^[А-ЯЁA-Z]/) || [''])[0])
    .filter(Boolean);
  return (caps[0] || '') + (caps[1] || '');
}

export function yearsStr(p: Pick<Person, 'a' | 'b' | 'd'>): string {
  const b = (p.a ? 'ок. ' : '') + p.b;
  const d = p.d ? (p.a && p.d < 1700 ? 'ок. ' : '') + p.d : 'н. в.';
  return `${b} — ${d}`;
}

export function roundRect(
  c: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
