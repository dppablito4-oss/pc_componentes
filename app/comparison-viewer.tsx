'use client';
import { partNameEs } from '@/lib/locale-es';
import { useState } from 'react';
import {
  comparisonItem,
  type ComparisonViewState,
} from '@/lib/comparison-state';
import { useViewerEngine } from './use-viewer-engine';

type Props = {
  state: ComparisonViewState;
};

export default function ComparisonViewer({ state }: Props) {
  const [hover, setHover] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);
  const left = comparisonItem(state.left),
    right = comparisonItem(state.right);
  const { host, error, ready } = useViewerEngine(
    state,
    {},
    () =>
      import('@/lib/comparison-scene').then(
        ({ createComparisonViewer }) => createComparisonViewer,
      ),
    (_current, reportError) => ({
      stats: () => {},
      hover: (name, x, y) =>
        setHover((previous) =>
          name
            ? previous?.name === name && previous.x === x && previous.y === y
              ? previous
              : { name, x, y }
            : null,
        ),
      error: reportError,
    }),
    'No se pudo cargar el comparador. Reload to try again.',
  );

  return (
    <>
      <div
        ref={host}
        className="comparison-viewport"
        data-active-side={state.activeSide}
        aria-label={`Comparación 3D sincronizada de ${partNameEs(left)} y ${partNameEs(right)}`}
      >
        <section
          className="comparison-pane-a11y left"
          aria-label={`Visor izquierdo: ${partNameEs(left)}`}
        />
        <section
          className="comparison-pane-a11y right"
          aria-label={`Visor derecho: ${partNameEs(right)}`}
        />
      </div>
      {!ready && !error && (
        <output className="comparison-loading">Loading both models…</output>
      )}
      {error && (
        <div className="comparison-error" role="alert">
          {error}
          <button onClick={() => location.reload()}>Recargar visor</button>
        </div>
      )}
      {hover && (
        <div
          className="hover-label comparison-hover"
          role="tooltip"
          style={{
            left: Math.max(8, Math.min(hover.x + 16, window.innerWidth - 220)),
            top: Math.max(10, Math.min(hover.y - 48, window.innerHeight - 70)),
          }}
        >
          {hover.name}
          <span>Compared part</span>
        </div>
      )}
    </>
  );
}
