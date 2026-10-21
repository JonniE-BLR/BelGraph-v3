import type { CategoryId, GraphEdge, GraphNode, ViewMode } from '@/types';
import { CATS, ERAS, LANES, YEAR_FROM, YEAR_TO } from '@/data/categories';
import { ANCHORS } from '@/lib/graph';
import { PI2, clamp, hash, initials, rnd, roundRect } from '@/lib/utils';

export interface EngineCallbacks {
  onSelect: (n: GraphNode | null) => void;
  onHover: (n: GraphNode | null, x: number, y: number) => void;
}

const TL = { padL: 190, padT: 120, laneH: 124 };

interface Star { x: number; y: number; r: number; s: number; p: number; }

export class GraphEngine {
  private ctx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D | null = null;
  private W = 1; private H = 1;
  private raf = 0;
  private frame = 0;
  private stars: Star[] = [];
  private TLW = 1600;
  private bb = { x: -600, y: -500, w: 1200, h: 1000 };

  cam = { x: 0, y: 0, k: 0.3, tx: 0, ty: 0, tk: 0.3 };
  mode: ViewMode = 'graph';
  year = YEAR_TO;
  filterCat: CategoryId | null = null;
  sel: GraphNode | null = null;
  hover: GraphNode | null = null;
  private selAdj = new Set<GraphNode>();

  private drag: GraphNode | null = null;
  private panning = false;
  private moved = false;
  private ptrs = new Map<number, { x: number; y: number }>();
  private lastPinch = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    minimap: HTMLCanvasElement | null,
    public nodes: GraphNode[],
    public edges: GraphEdge[],
    private cb: EngineCallbacks,
  ) {
    this.ctx = canvas.getContext('2d')!;
    if (minimap) this.mctx = minimap.getContext('2d');
    for (let i = 0; i < 120; i++) {
      this.stars.push({ x: Math.random(), y: Math.random(), r: rnd(0.4, 1.6), s: rnd(0.05, 0.35), p: Math.random() * PI2 });
    }
    this.bindEvents();
    this.resize();
    this.fit();
  }

  // ------------------------------------------------------------ lifecycle
  start() { if (!this.raf) this.raf = requestAnimationFrame(this.loop); }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
  destroy() { this.stop(); this.unbindEvents(); }

  resize = () => {
    this.W = window.innerWidth; this.H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.W * dpr; this.canvas.height = this.H * dpr;
    this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.computeTL();
  };

  // ------------------------------------------------------------ public API
  setMode(m: ViewMode) {
    this.mode = m;
    if (m === 'tl') { this.computeTL(); setTimeout(() => this.fit(), 60); }
    else this.fit();
  }
  setYear(y: number) { this.year = y; }
  setFilter(c: CategoryId | null) { this.filterCat = c; }

  select(n: GraphNode | null) {
    this.sel = n;
    this.selAdj = new Set();
    if (n) {
      for (const e of this.edges) {
        if (e.s === n) this.selAdj.add(e.t);
        if (e.t === n) this.selAdj.add(e.s);
      }
      this.cam.tk = Math.max(this.cam.tk, this.mode === 'graph' ? 1.1 : 1.6);
      const px = this.W > 760 ? 180 / this.cam.tk : 0;
      this.cam.tx = n.x + px; this.cam.ty = n.y;
    }
    this.cb.onSelect(n);
  }
  deselect() { if (this.sel) { this.select(null); this.fit(); } }

  zoom(f: number) { this.zoomAt(this.W / 2, this.H / 2, f); }
  shuffle() {
    for (const n of this.nodes) { n.vx += rnd(-7, 7); n.vy += rnd(-7, 7); }
    this.fit();
  }
  fit() {
    this.computeBB();
    const b = this.bb, m = this.mode === 'tl' ? 70 : 110;
    this.cam.tx = b.x + b.w / 2; this.cam.ty = b.y + b.h / 2;
    const availH = this.H - (this.W > 760 ? 200 : 140);
    this.cam.tk = clamp(Math.min((this.W - 40) / (b.w + m * 2), availH / (b.h + m * 2)), 0.2, 2.4);
  }
  minimapJump(cx: number, cy: number, mw: number, mh: number) {
    const s = Math.min((mw - 14) / this.bb.w, (mh - 14) / this.bb.h);
    const ox = (mw - this.bb.w * s) / 2, oy = (mh - this.bb.h * s) / 2;
    this.cam.tx = (cx - ox) / s + this.bb.x;
    this.cam.ty = (cy - oy) / s + this.bb.y;
  }

  // ------------------------------------------------------------ geometry
  private toWorld(sx: number, sy: number): [number, number] {
    return [(sx - this.W / 2) / this.cam.k + this.cam.x, (sy - this.H / 2) / this.cam.k + this.cam.y];
  }
  private yearX = (y: number) => TL.padL + ((y - YEAR_FROM) / (YEAR_TO - YEAR_FROM)) * this.TLW;
  private computeTL() {
    this.TLW = Math.max(1500, this.W * 1.1);
    for (const n of this.nodes) {
      const lane = LANES.indexOf(n.c), h = hash(n.i);
      n.tx = this.yearX(n.b);
      n.ty = TL.padT + lane * TL.laneH + (((h % 89) / 89) * 2 - 1) * (TL.laneH * 0.32);
    }
  }
  private computeBB() {
    let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
    for (const n of this.nodes) {
      const x = this.mode === 'tl' ? n.tx : n.x, y = this.mode === 'tl' ? n.ty : n.y;
      mnx = Math.min(mnx, x - n.r); mxx = Math.max(mxx, x + n.r);
      mny = Math.min(mny, y - n.r); mxy = Math.max(mxy, y + n.r);
    }
    if (this.mode === 'tl') { mnx = Math.min(mnx, this.yearX(YEAR_FROM) - 170); mny = Math.min(mny, TL.padT - 100); }
    this.bb = { x: mnx, y: mny, w: mxx - mnx, h: mxy - mny };
  }
  private zoomAt(sx: number, sy: number, f: number) {
    const k2 = clamp(this.cam.tk * f, 0.2, 2.6);
    const wx = (sx - this.W / 2) / this.cam.tk + this.cam.tx;
    const wy = (sy - this.H / 2) / this.cam.tk + this.cam.ty;
    this.cam.tk = k2;
    this.cam.tx = wx - (sx - this.W / 2) / k2;
    this.cam.ty = wy - (sy - this.H / 2) / k2;
  }

  // ------------------------------------------------------------ physics
  private physics() {
    const nodes = this.nodes;
    if (this.mode !== 'graph') {
      for (const n of nodes) { n.x += (n.tx - n.x) * 0.085; n.y += (n.ty - n.y) * 0.085; }
      return;
    }
    const L = nodes.length;
    for (let i = 0; i < L; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < L; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = rnd(-1, 1); dy = rnd(-1, 1); d2 = 24; }
        if (d2 > 160000) continue;
        const f = (3600 / d2) / Math.sqrt(d2);
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
      }
    }
    for (const e of this.edges) {
      const dx = e.t.x - e.s.x, dy = e.t.y - e.s.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      const rest = 120 + (e.s.deg + e.t.deg) * 2.2, f = ((d - rest) * 0.011) / d;
      e.s.vx += dx * f; e.s.vy += dy * f; e.t.vx -= dx * f; e.t.vy -= dy * f;
    }
    for (const n of nodes) {
      if (n === this.drag) continue;
      const an = ANCHORS[n.c];
      n.vx += (an.x - n.x) * 0.0032; n.vy += (an.y - n.y) * 0.0032;
      n.vx += -n.x * 0.0008; n.vy += -n.y * 0.0008;
      n.vx *= 0.88; n.vy *= 0.88; n.x += n.vx; n.y += n.vy;
    }
    for (let i = 0; i < L; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < L; j++) {
        const b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r + 8, d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < min * min) {
          const d = Math.sqrt(d2), push = (min - d) / 2 / d;
          if (a !== this.drag) { a.x -= dx * push; a.y -= dy * push; }
          if (b !== this.drag) { b.x += dx * push; b.y += dy * push; }
        }
      }
    }
  }

  // ------------------------------------------------------------ render
  private nodeAlpha(n: GraphNode) {
    if (this.filterCat && n.c !== this.filterCat) return 0.06;
    if (this.mode === 'tl') { if (n.b > this.year) return 0.1; if (n.d && n.d < this.year) return 0.35; }
    return 1;
  }

  private loop = (t: number) => {
    this.physics();
    const c = this.cam;
    c.x += (c.tx - c.x) * 0.11; c.y += (c.ty - c.y) * 0.11; c.k += (c.tk - c.k) * 0.11;
    const ctx = this.ctx, W = this.W, H = this.H;
    ctx.clearRect(0, 0, W, H);
    for (const s of this.stars) {
      const x = (((s.x * W - c.x * s.s * c.k * 0.6) % W) + W) % W;
      const y = (((s.y * H - c.y * s.s * c.k * 0.6) % H) + H) % H;
      ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(t * 0.001 + s.p));
      ctx.fillStyle = 'rgba(210,220,255,.7)';
      ctx.fillRect(x, y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(c.k, c.k); ctx.translate(-c.x, -c.y);
    if (this.mode === 'tl') this.drawTimeline();
    this.drawEdges();
    this.drawNodes(t);
    ctx.restore();
    if (this.frame++ % 4 === 0) this.drawMinimap();
    this.raf = requestAnimationFrame(this.loop);
  };

  private drawEdges() {
    const ctx = this.ctx, sel = this.sel, hover = this.hover;
    for (const e of this.edges) {
      const a = Math.min(this.nodeAlpha(e.s), this.nodeAlpha(e.t));
      if (a <= 0.01) continue;
      const active = sel && (e.s === sel || e.t === sel);
      const hot = hover && (e.s === hover || e.t === hover);
      if (active) {
        const g = ctx.createLinearGradient(e.s.x, e.s.y, e.t.x, e.t.y);
        g.addColorStop(0, CATS[e.s.c].color); g.addColorStop(1, CATS[e.t.c].color);
        ctx.strokeStyle = g; ctx.globalAlpha = a * 0.85; ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = hot ? CATS[e.s.c].color : '#ffffff';
        ctx.globalAlpha = hot ? a * 0.35 : a * (sel ? 0.04 : this.mode === 'tl' ? 0.06 : 0.08);
        ctx.lineWidth = hot ? 1.4 : 1;
      }
      ctx.beginPath(); ctx.moveTo(e.s.x, e.s.y); ctx.lineTo(e.t.x, e.t.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (sel) {
      ctx.font = '500 10px "Golos Text", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const e of this.edges) {
        if (e.s !== sel && e.t !== sel) continue;
        const mx = e.s.x + (e.t.x - e.s.x) * 0.55, my = e.s.y + (e.t.y - e.s.y) * 0.55;
        const w = ctx.measureText(e.l).width;
        roundRect(ctx, mx - w / 2 - 7, my - 10, w + 14, 20, 10);
        ctx.fillStyle = 'rgba(7,10,16,.92)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = 'rgba(233,230,220,.9)'; ctx.fillText(e.l, mx, my + 0.5);
      }
    }
  }

  private drawNodes(t: number) {
    const ctx = this.ctx, sel = this.sel, hover = this.hover, k = this.cam.k;
    for (const n of this.nodes) {
      let a = this.nodeAlpha(n);
      if (sel && n !== sel && !this.selAdj.has(n)) a *= 0.45;
      if (a <= 0.015) continue;
      const r = n.r * (sel === n ? 1.14 : 1);
      const col = CATS[n.c].color;
      ctx.globalAlpha = a;
      if (sel === n || hover === n) { ctx.shadowColor = col; ctx.shadowBlur = sel === n ? 30 : 18; }
      if (n.img) {
        ctx.save(); ctx.beginPath(); ctx.arc(n.x, n.y, r - 2, 0, PI2); ctx.clip();
        const iw = n.img.naturalWidth, ih = n.img.naturalHeight;
        const sc = Math.max((2 * (r - 2)) / iw, (2 * (r - 2)) / ih), dw = iw * sc, dh = ih * sc;
        ctx.drawImage(n.img, n.x - dw / 2, n.y - dh / 2, dw, dh);
        ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(n.x, n.y, r - 2, 0, PI2);
        ctx.fillStyle = 'rgba(20,26,38,.95)'; ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(n.x, n.y, r - 2, 0, PI2); ctx.clip();
        ctx.fillStyle = col; ctx.globalAlpha = a * 0.22;
        ctx.beginPath(); ctx.arc(n.x, n.y + r * 0.7, r * 1.15, 0, PI2); ctx.fill();
        ctx.restore();
        ctx.globalAlpha = a;
        ctx.font = `700 ${Math.round(r * 0.62)}px "Golos Text", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = col; ctx.fillText(initials(n), n.x, n.y + 1);
      }
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, PI2);
      ctx.lineWidth = sel === n ? 3 : 2; ctx.strokeStyle = col; ctx.stroke();
      if (sel === n) {
        const ph = (t % 1600) / 1600;
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 4 + ph * 16, 0, PI2);
        ctx.lineWidth = 1.6; ctx.strokeStyle = col; ctx.globalAlpha = (1 - ph) * 0.6; ctx.stroke();
        ctx.globalAlpha = a;
      }
      ctx.globalAlpha = 1;
      if (k > 0.58 || sel === n || hover === n || (n.hub && k > 0.3)) {
        ctx.font = '600 11px "Golos Text", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.globalAlpha = a;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(5,7,12,.9)'; ctx.strokeText(n.n, n.x, n.y + r + 5);
        ctx.fillStyle = sel === n ? '#fff' : 'rgba(233,230,220,.9)'; ctx.fillText(n.n, n.x, n.y + r + 5);
        ctx.globalAlpha = 1;
      }
    }
  }

  private drawTimeline() {
    const ctx = this.ctx;
    const bot = TL.padT + LANES.length * TL.laneH, top = TL.padT - 92;
    for (const e of ERAS) {
      const x0 = this.yearX(Math.max(e.from, YEAR_FROM)), x1 = this.yearX(Math.min(e.to, YEAR_TO));
      ctx.fillStyle = e.color; ctx.fillRect(x0, top, x1 - x0, bot - top);
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0, bot); ctx.stroke();
      ctx.font = '600 12px "Golos Text", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillText(e.name, x0 + 12, top + 12);
    }
    ctx.textAlign = 'center';
    for (let y = 1100; y <= 2000; y += 100) {
      const x = this.yearX(y);
      ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.setLineDash([3, 7]);
      ctx.beginPath(); ctx.moveTo(x, top + 34); ctx.lineTo(x, bot + 20); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '10px "Golos Text", sans-serif'; ctx.fillText(String(y), x, bot + 26);
    }
    ctx.textAlign = 'right'; ctx.font = '700 10px "Golos Text", sans-serif';
    LANES.forEach((c, i) => {
      ctx.fillStyle = CATS[c].color; ctx.globalAlpha = 0.85;
      ctx.fillText(CATS[c].name.toUpperCase(), this.yearX(YEAR_FROM) - 16, TL.padT + i * TL.laneH - 5);
    });
    ctx.globalAlpha = 1;
    const x = this.yearX(this.year);
    ctx.strokeStyle = 'rgba(251,191,36,.75)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, top + 34); ctx.lineTo(x, bot + 20); ctx.stroke();
    roundRect(ctx, x - 30, top + 2, 60, 24, 12); ctx.fillStyle = 'rgba(251,191,36,.95)'; ctx.fill();
    ctx.fillStyle = '#14100a'; ctx.font = '700 12px "Golos Text", sans-serif'; ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; ctx.fillText(String(this.year), x, top + 14);
  }

  private drawMinimap() {
    const m = this.mctx; if (!m || this.W < 640) return;
    const mw = m.canvas.width, mh = m.canvas.height, bb = this.bb;
    m.clearRect(0, 0, mw, mh);
    const s = Math.min((mw - 14) / bb.w, (mh - 14) / bb.h);
    const ox = (mw - bb.w * s) / 2, oy = (mh - bb.h * s) / 2;
    for (const n of this.nodes) {
      m.fillStyle = CATS[n.c].color; m.globalAlpha = 0.8;
      m.beginPath(); m.arc((n.x - bb.x) * s + ox, (n.y - bb.y) * s + oy, 1.8, 0, PI2); m.fill();
    }
    m.globalAlpha = 1;
    const vw = (this.W / this.cam.k) * s, vh = (this.H / this.cam.k) * s;
    m.strokeStyle = 'rgba(251,191,36,.85)'; m.lineWidth = 1.2;
    m.strokeRect((this.cam.x - bb.x) * s + ox - vw / 2, (this.cam.y - bb.y) * s + oy - vh / 2, vw, vh);
  }

  // ------------------------------------------------------------ pointer
  private hitNode(sx: number, sy: number) {
    const [wx, wy] = this.toWorld(sx, sy);
    let best: GraphNode | null = null, bd = 1e9;
    for (const n of this.nodes) {
      if (this.nodeAlpha(n) < 0.2) continue;
      const d = (n.x - wx) ** 2 + (n.y - wy) ** 2;
      if (d < (n.r + 7) ** 2 && d < bd) { bd = d; best = n; }
    }
    return best;
  }

  private onDown = (e: PointerEvent) => {
    this.canvas.setPointerCapture(e.pointerId);
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.moved = false; this.lastPinch = 0;
    if (this.ptrs.size === 1) {
      const n = this.hitNode(e.clientX, e.clientY);
      if (n) { this.drag = n; n.vx = n.vy = 0; }
      else { this.panning = true; this.canvas.classList.add('grabbing'); }
    }
  };
  private onMove = (e: PointerEvent) => {
    if (!this.ptrs.has(e.pointerId)) {
      const n = this.hitNode(e.clientX, e.clientY);
      if (n !== this.hover) {
        this.hover = n;
        this.canvas.classList.toggle('pointing', !!n);
        this.cb.onHover(n, e.clientX, e.clientY);
      } else if (n) this.cb.onHover(n, e.clientX, e.clientY);
      return;
    }
    const p = this.ptrs.get(e.pointerId)!;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 2) this.moved = true;
    if (this.ptrs.size === 2) {
      const [pa, pb] = [...this.ptrs.values()];
      const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      if (this.lastPinch) this.zoomAt((pa.x + pb.x) / 2, (pa.y + pb.y) / 2, dist / this.lastPinch);
      this.lastPinch = dist; return;
    }
    if (this.drag) {
      const [wx, wy] = this.toWorld(e.clientX, e.clientY);
      this.drag.x = wx; this.drag.y = wy; this.drag.vx = this.drag.vy = 0;
    } else if (this.panning) {
      this.cam.tx -= dx / this.cam.k; this.cam.ty -= dy / this.cam.k;
      this.cam.x = this.cam.tx; this.cam.y = this.cam.ty;
      this.cb.onHover(null, 0, 0);
    }
  };
  private onUp = (e: PointerEvent) => {
    this.ptrs.delete(e.pointerId); this.lastPinch = 0;
    if (this.drag && !this.moved) this.select(this.drag);
    else if (!this.drag && this.panning && !this.moved) this.deselect();
    this.drag = null; this.panning = false; this.canvas.classList.remove('grabbing');
  };
  private onCancel = (e: PointerEvent) => {
    this.ptrs.delete(e.pointerId); this.drag = null; this.panning = false;
    this.canvas.classList.remove('grabbing');
  };
  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0011));
    this.cb.onHover(null, 0, 0);
  };
  private onLeave = () => { this.hover = null; this.cb.onHover(null, 0, 0); };

  private bindEvents() {
    const c = this.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onCancel);
    c.addEventListener('pointerleave', this.onLeave);
    c.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.resize);
  }
  private unbindEvents() {
    const c = this.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointercancel', this.onCancel);
    c.removeEventListener('pointerleave', this.onLeave);
    c.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.resize);
  }
}
