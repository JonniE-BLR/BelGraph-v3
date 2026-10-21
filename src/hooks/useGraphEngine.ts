import { useEffect, useMemo, useRef, useState } from 'react';
import type { CategoryId, GraphNode, ViewMode } from '@/types';
import { GraphEngine } from '@/engine/GraphEngine';
import { buildGraph } from '@/lib/graph';
import { loadPhotos } from '@/lib/wiki';

export interface HoverState { node: GraphNode; x: number; y: number; }

export function useGraphEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GraphEngine | null>(null);

  const graph = useMemo(() => buildGraph(), []);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [mode, setModeState] = useState<ViewMode>('graph');
  const [filterCat, setFilterState] = useState<CategoryId | null>(null);
  const [year, setYearState] = useState(2026);
  const [photoTick, setPhotoTick] = useState(0);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const engine = new GraphEngine(cv, minimapRef.current, graph.nodes, graph.edges, {
      onSelect: (n) => setSelected(n),
      onHover: (n, x, y) => setHover(n ? { node: n, x, y } : null),
    });
    engineRef.current = engine;
    engine.start();
    loadPhotos(graph.nodes, () => setPhotoTick((t) => t + 1));
    return () => { engine.destroy(); engineRef.current = null; };
  }, [graph]);

  const api = useMemo(() => ({
    select: (n: GraphNode | null) => engineRef.current?.select(n),
    deselect: () => engineRef.current?.deselect(),
    selectById: (id: string) => { const n = graph.byId[id]; if (n) engineRef.current?.select(n); },
    random: () => engineRef.current?.select(graph.nodes[Math.floor(Math.random() * graph.nodes.length)]),
    setMode: (m: ViewMode) => { setModeState(m); engineRef.current?.setMode(m); },
    setFilter: (c: CategoryId | null) => { setFilterState(c); engineRef.current?.setFilter(c); },
    setYear: (y: number) => { setYearState(y); engineRef.current?.setYear(y); },
    zoomIn: () => engineRef.current?.zoom(1.3),
    zoomOut: () => engineRef.current?.zoom(1 / 1.3),
    fit: () => engineRef.current?.fit(),
    shuffle: () => { if (engineRef.current?.mode !== 'graph') { setModeState('graph'); engineRef.current?.setMode('graph'); } engineRef.current?.shuffle(); },
    minimapJump: (cx: number, cy: number, w: number, h: number) => engineRef.current?.minimapJump(cx, cy, w, h),
  }), [graph]);

  return { canvasRef, minimapRef, graph, selected, hover, mode, filterCat, year, photoTick, api };
}
