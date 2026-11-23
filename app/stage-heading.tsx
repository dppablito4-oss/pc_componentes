'use client';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  MousePointerClick,
  X,
} from 'lucide-react';
import type { Concept } from '@/lib/manifest';
import { levelPath, levels, type LevelId } from '@/lib/levels';
import {
  bilingualPartName,
  levelNameEs,
  levelTitleEs,
  partNameEs,
} from '@/lib/locale-es';
import { hueOfLevel, hueOfSystem, hueStyle } from '@/lib/palette';

type Props = {
  level: LevelId;
  explode: number;
  logical: boolean;
  selected: Concept | null;
  /** Show the first-visit line about what clicking does. */
  hint?: boolean;
  onDismissHint?: () => void;
  onNavigate: (level: LevelId) => void;
  navigation: {
    move: (direction: -1 | 1) => boolean;
    canGoBack: boolean;
    canGoForward: boolean;
  };
};

/** A tap cannot right-click, so a phone is told the two-tap version. */
function hintCopy() {
  return typeof matchMedia !== 'undefined' &&
    matchMedia('(pointer: coarse)').matches
    ? 'Toca una pieza para ver su ficha y explorar su interior.'
    : 'Haz clic para abrir una pieza o haz clic derecho para inspeccionarla.';
}

export default function StageHeading({
  level,
  explode,
  logical,
  selected,
  hint = false,
  onDismissHint,
  onNavigate,
  navigation,
}: Props) {
  const scale = levels[level],
    path = levelPath(level);
  return (
    <section className="stage-heading">
      <div>
        <div className="stage-title-row">
          <nav className="stage-history" aria-label="Historial del explorador">
            <button
              type="button"
              title="Atrás"
              aria-label="Atrás"
              disabled={!navigation.canGoBack}
              onClick={() => navigation.move(-1)}
            >
              <ArrowLeft size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Adelante"
              aria-label="Adelante"
              disabled={!navigation.canGoForward}
              onClick={() => navigation.move(1)}
            >
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </nav>
          <h1>
            {explode === 100
              ? 'Inventario de componentes'
              : explode > 0
                ? logical
                  ? 'Recursos separados'
                  : 'Desmontaje'
                : levelTitleEs(level)}
          </h1>
        </div>
        {path.length > 1 && (
          <div className="stage-meta">
            <nav className="breadcrumbs" aria-label="Jerarquía de componentes">
              <button
                aria-label="Subir al módulo padre"
                onClick={() => onNavigate(path[path.length - 2])}
              >
                <ArrowLeft size={14} />
              </button>
              {path.map((id, i) => (
                <span key={id} style={hueStyle(hueOfLevel(id))}>
                  {i > 0 && <ChevronRight size={12} />}
                  <button
                    aria-current={id === level ? 'page' : undefined}
                    title={levels[id].name}
                    onClick={() => onNavigate(id)}
                  >
                    {levelNameEs(id)}
                  </button>
                </span>
              ))}
              {selected && selected.shortName !== scale.name && (
                <span style={hueStyle(hueOfSystem(selected.category))}>
                  <ChevronRight size={12} />
                  <span
                    className="crumb-selected"
                    title={bilingualPartName(selected)}
                  >
                    {partNameEs(selected, true)}
                  </span>
                </span>
              )}
            </nav>
          </div>
        )}
        {hint && (
          <p className="first-visit-hint">
            <MousePointerClick size={15} aria-hidden="true" />
            <span>{hintCopy()}</span>
            <button aria-label="Cerrar sugerencia" onClick={onDismissHint}>
              <X size={14} />
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
