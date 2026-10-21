import type { CategoryId, GraphEdge, GraphNode } from '@/types';
import { PEOPLE } from '@/data/people';
import { CONNECTIONS } from '@/data/connections';
import { LANES } from '@/data/categories';
import { clamp, hash } from './utils';

/** Якоря категорий — граф распадается на «созвездия» */
export const ANCHORS: Record<CategoryId, { x: number; y: number }> = {} as never;
LANES.forEach((c, k) => {
  const a = -Math.PI / 2.6 + (k * 2 * Math.PI) / LANES.length;
  ANCHORS[c] = { x: Math.cos(a) * 560, y: Math.sin(a) * 500 };
});

export function buildGraph() {
  const nodes: GraphNode[] = PEOPLE.map((p, idx) => ({
    ...p,
    idx, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, r: 20, deg: 0,
    img: null, photo: null, wikiUrl: null,
  }));
  const byId: Record<string, GraphNode> = {};
  nodes.forEach((n) => (byId[n.i] = n));

  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const [a, b, l] of CONNECTIONS) {
    const s = byId[a], t = byId[b];
    if (!s || !t) {
      console.warn('Неизвестный id в связи:', a, b);
      continue;
    }
    const key = [a, b].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ s, t, l });
  }
  edges.forEach((e) => { e.s.deg++; e.t.deg++; });

  nodes.forEach((n) => {
    n.r = clamp(18 + n.deg * 1.4 + (n.hub ? 6 : 0), 18, 38);
    const an = ANCHORS[n.c], h = hash(n.i);
    n.x = an.x + ((h % 233) / 233) * 360 - 180;
    n.y = an.y + (((h >> 4) % 233) / 233) * 360 - 180;
  });

  return { nodes, edges, byId };
}
