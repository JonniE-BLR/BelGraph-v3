import type { GraphNode } from '@/types';

const CACHE_KEY = 'spc4';
type Cache = Record<string, { p: string; u: string }>;

let cache: Cache = {};
try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { /* ignore */ }

function saveCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* ignore */ }
}

async function fetchPhoto(n: GraphNode): Promise<boolean> {
  for (const spec of n.w) {
    const i = spec.indexOf(':');
    const lang = spec.slice(0, i), title = spec.slice(i + 1);
    try {
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=420&redirects=1&format=json&origin=*&titles=${encodeURIComponent(title)}`;
      const r = await fetch(url);
      const j = await r.json();
      const pages = j.query?.pages;
      if (pages) {
        const p = Object.values(pages)[0] as { title?: string; thumbnail?: { source: string } };
        if (p?.thumbnail?.source) {
          n.photo = p.thumbnail.source;
          n.wikiUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title || title)}`;
          return true;
        }
      }
    } catch { /* следующий вариант */ }
  }
  return false;
}

async function loadOne(n: GraphNode, onUpdate: (n: GraphNode) => void) {
  try {
    if (cache[n.i]) {
      n.photo = cache[n.i].p;
      n.wikiUrl = cache[n.i].u;
    } else if (await fetchPhoto(n)) {
      cache[n.i] = { p: n.photo!, u: n.wikiUrl! };
      saveCache();
    }
    if (n.photo) {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => { n.img = im; onUpdate(n); };
      im.src = n.photo;
      onUpdate(n);
    }
  } catch { /* ignore */ }
}

/** Загружает фото для всех узлов с ограничением параллельности */
export function loadPhotos(nodes: GraphNode[], onUpdate: (n: GraphNode) => void, parallel = 4) {
  let qi = 0;
  const step = () => {
    if (qi >= nodes.length) return;
    const n = nodes[qi++];
    loadOne(n, onUpdate).finally(step);
  };
  for (let k = 0; k < parallel; k++) step();
}
