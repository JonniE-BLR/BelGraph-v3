import { Maximize, Minus, Plus, Shuffle } from 'lucide-react';
import type { RefObject } from 'react';

interface Props {
  minimapRef: RefObject<HTMLCanvasElement | null>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onShuffle: () => void;
  onMinimapJump: (cx: number, cy: number, w: number, h: number) => void;
}

export function Controls({ minimapRef, onZoomIn, onZoomOut, onFit, onShuffle, onMinimapJump }: Props) {
  return (
    <div className="fixed right-4 bottom-4 z-30 flex flex-col items-end gap-2">
      <canvas
        ref={minimapRef}
        width={168}
        height={112}
        className="glass rounded-xl pointer-events-auto cursor-pointer hidden sm:block"
        style={{ padding: 4 }}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onMinimapJump(e.clientX - r.left, e.clientY - r.top, e.currentTarget.width, e.currentTarget.height);
        }}
      />
      <div className="glass rounded-2xl p-1 flex flex-col gap-0.5 pointer-events-auto">
        <button className="icobtn" title="Приблизить" onClick={onZoomIn}><Plus className="w-4 h-4" /></button>
        <button className="icobtn" title="Отдалить" onClick={onZoomOut}><Minus className="w-4 h-4" /></button>
        <button className="icobtn" title="Показать всё" onClick={onFit}><Maximize className="w-4 h-4" /></button>
        <button className="icobtn" title="Перемешать" onClick={onShuffle}><Shuffle className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
