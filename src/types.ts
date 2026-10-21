export type CategoryId = 'enlight' | 'hist' | 'lit' | 'sci' | 'art' | 'sport' | 'it';

export interface Category {
  name: string;
  color: string;
}

export interface Person {
  /** уникальный id */
  i: string;
  /** имя */
  n: string;
  /** год рождения */
  b: number;
  /** год смерти (null — ныне здравствует) */
  d: number | null;
  /** даты приблизительные */
  a?: boolean;
  /** сфера */
  c: CategoryId;
  /** ключевая фигура (крупнее узел) */
  hub?: boolean;
  /** короткое амплуа: «поэт», «физик-нобелиат» */
  role: string;
  /** место рождения */
  place: string;
  /** развёрнутая биография */
  bio: string;
  /** цитата */
  q?: string;
  /** ключевые факты */
  f: string[];
  /** наследие / память */
  legacy: string;
  /** страницы Википедии lang:Title */
  w: string[];
}

export type Connection = [from: string, to: string, label: string];

export interface GraphNode extends Person {
  idx: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  r: number;
  deg: number;
  img: HTMLImageElement | null;
  photo: string | null;
  wikiUrl: string | null;
}

export interface GraphEdge {
  s: GraphNode;
  t: GraphNode;
  l: string;
}

export type ViewMode = 'graph' | 'tl';

export interface Era {
  from: number;
  to: number;
  name: string;
  color: string;
}
