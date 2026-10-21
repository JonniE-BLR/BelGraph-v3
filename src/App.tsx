import { useEffect, useMemo, useState } from 'react';
import { useGraphEngine } from '@/hooks/useGraphEngine';
import { Header } from '@/components/Header';
import { Legend } from '@/components/Legend';
import { Controls } from '@/components/Controls';
import { TimelineSlider } from '@/components/TimelineSlider';
import { Tooltip } from '@/components/Tooltip';
import { PersonPanel } from '@/components/PersonPanel';
import { Splash } from '@/components/Splash';

export default function App() {
  const { canvasRef, minimapRef, graph, selected, hover, mode, filterCat, year, photoTick, api } = useGraphEngine();
  const [splash, setSplash] = useState(true);

  const firstYear = useMemo(() => Math.min(...graph.nodes.map((n) => n.b)), [graph]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') api.deselect(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [api]);

  return (
    <>
      <canvas ref={canvasRef} className="graph" />
      <div className="grain" />

      <Header mode={mode} nodes={graph.nodes} onMode={api.setMode} onRandom={api.random} onPick={api.selectById} />

      {mode === 'graph'
        ? <Legend nodes={graph.nodes} filter={filterCat} onFilter={api.setFilter} />
        : <TimelineSlider year={year} onYear={api.setYear} />}

      <Controls
        minimapRef={minimapRef}
        onZoomIn={api.zoomIn} onZoomOut={api.zoomOut} onFit={api.fit} onShuffle={api.shuffle}
        onMinimapJump={api.minimapJump}
      />

      <Tooltip hover={selected ? null : hover} />

      <PersonPanel node={selected} edges={graph.edges} photoTick={photoTick} onClose={api.deselect} onJump={api.selectById} />

      {splash && (
        <Splash
          people={graph.nodes.length}
          links={graph.edges.length}
          firstYear={firstYear}
          onStart={() => { setSplash(false); api.fit(); }}
          onRandom={() => { setSplash(false); api.fit(); setTimeout(api.random, 500); }}
        />
      )}
    </>
  );
}
