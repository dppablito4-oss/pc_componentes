'use client';
import { useCallback, useMemo, useRef, useState, type RefObject } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronLeft,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import {
  canComparePhysicalScale,
  comparisonCategoryEs,
  comparisonItem,
  createComparisonState,
  selectComparisonItem,
  setComparisonActiveSide,
  setComparisonExplode,
  setComparisonFraming,
  setComparisonSpecsOpen,
  otherSide,
  sideLetter,
  swapComparisonSides,
  type ComparisonFraming,
  type ComparisonItem,
  type ComparisonLevel,
  type ComparisonSide,
  type ComparisonViewState,
} from '@/lib/comparison-state';
import { hueOfCategory, hueStyle } from '@/lib/palette';
import ComparisonPicker from './comparison-picker';
import ComparisonViewer from './comparison-viewer';
import ComparisonSpecs from './comparison-specs';
import Disassembly from './disassembly';
import { partNameEs } from '@/lib/locale-es';
import { EXPLORER } from './links';
import { useDisassemblyPlayback } from './use-disassembly-playback';
import './comparison.css';

type Props = { initialLevel: ComparisonLevel; onExit: () => void };

function framingNote(framing: ComparisonFraming, trueSizeAvailable: boolean) {
  if (framing === 'scale')
    return 'Ambos modelos tienen la misma escala física.';
  return trueSizeAvailable
    ? 'Cada modelo se ajusta a su panel y tiene su propia escala.'
    : 'Cada modelo se ajusta a su panel. Los diagramas ilustrativos carecen de escala física.';
}

function disassemblyTitle(left: ComparisonItem, right: ComparisonItem) {
  if (left.kind !== right.kind) return 'Explorar ambos';
  return left.kind === 'logical' ? 'Expandir ambos' : 'Desmontar ambos';
}

type PartSelectorProps = {
  side: ComparisonSide;
  item: ComparisonItem;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onOpen: () => void;
};

/** The card above each pane; it opens that side's picker. */
function PartSelector({ side, item, buttonRef, onOpen }: PartSelectorProps) {
  return (
    <button
      className={`comparison-selector ${side}`}
      style={hueStyle(hueOfCategory(item.category))}
      ref={buttonRef}
      aria-label={`Elegir pieza ${sideLetter(side)}`}
      aria-haspopup="dialog"
      onClick={onOpen}
    >
      <span className="comparison-letter">{sideLetter(side)}</span>
      <span className="comparison-selected-part">
        <strong>{partNameEs(item, true)}</strong>
        <small>{comparisonCategoryEs[item.category]}</small>
      </span>
      <ChevronDown size={17} aria-hidden="true" />
    </button>
  );
}

export default function ComparisonWorkbench({ initialLevel, onExit }: Props) {
  const specsButton = useRef<HTMLButtonElement>(null);
  const selectorButtons = {
    left: useRef<HTMLButtonElement>(null),
    right: useRef<HTMLButtonElement>(null),
  };
  const [state, setState] = useState(() => createComparisonState(initialLevel));
  const [picker, setPicker] = useState<ComparisonSide | null>(null);
  const [viewerRevision, setViewerRevision] = useState(0);
  const updateExplode = useCallback(
    (explode: number) =>
      setState((current) => setComparisonExplode(current, explode)),
    [],
  );
  const {
    playing,
    setExplode,
    stop: stopDisassembly,
    toggleAuto,
  } = useDisassemblyPlayback(state.explode, updateExplode);
  const viewerState = useMemo<ComparisonViewState>(
    () => ({
      left: state.left,
      right: state.right,
      activeSide: state.activeSide,
      explode: state.explode,
      framing: state.framing,
    }),
    [state.activeSide, state.explode, state.framing, state.left, state.right],
  );
  const leftItem = comparisonItem(state.left);
  const rightItem = comparisonItem(state.right);
  const trueSizeAvailable = canComparePhysicalScale(state.left, state.right);
  const logical = leftItem.kind === 'logical' && rightItem.kind === 'logical';
  const reset = () => {
    stopDisassembly();
    setState((current) => ({ ...current, explode: 0 }));
    setViewerRevision((revision) => revision + 1);
  };
  const choose = (level: ComparisonLevel) => {
    if (!picker) return;
    stopDisassembly();
    setState((current) => selectComparisonItem(current, picker, level));
    setPicker(null);
  };
  const openPicker = (side: ComparisonSide) => {
    stopDisassembly();
    setPicker(side);
  };
  const selector = (side: ComparisonSide) => (
    <PartSelector
      side={side}
      item={side === 'left' ? leftItem : rightItem}
      buttonRef={selectorButtons[side]}
      onOpen={() => openPicker(side)}
    />
  );
  return (
    <main
      className="workbench comparison-workbench"
      data-active-side={state.activeSide}
    >
      <header className="comparison-topbar">
        <a className="comparison-brand" href={EXPLORER} aria-label="PC Anatomy">
          <Cpu size={20} aria-hidden="true" />
          <strong>PC Anatomy</strong>
        </a>
        <div className="comparison-top-actions">
          <button
            ref={specsButton}
            className="comparison-specs-button"
            aria-label="Especificaciones"
            onClick={() =>
              setState((current) => setComparisonSpecsOpen(current, true))
            }
          >
            <BarChart3 size={16} />
            <span>Datos</span>
          </button>
          <button
            className="comparison-exit"
            onClick={onExit}
            aria-label="Volver al explorador"
          >
            <ChevronLeft size={17} />
            <span>Volver al explorador</span>
          </button>
        </div>
      </header>
      <section className="comparison-setup" aria-label="Piezas comparadas">
        <div className="comparison-pair">
          {selector('left')}
          <button
            className="comparison-swap"
            onClick={() => setState(swapComparisonSides)}
            aria-label="Intercambiar los modelos"
          >
            <ArrowLeftRight size={18} />
          </button>
          {selector('right')}
        </div>
        <div className="comparison-framing">
          <fieldset aria-label="Escala de los modelos">
            <button
              aria-pressed={state.framing === 'fit'}
              onClick={() =>
                setState((current) => setComparisonFraming(current, 'fit'))
              }
            >
              Ajustar por separado
            </button>
            <button
              aria-pressed={state.framing === 'scale'}
              disabled={!trueSizeAvailable}
              aria-describedby="comparison-scale-note"
              onClick={() =>
                setState((current) => setComparisonFraming(current, 'scale'))
              }
            >
              Misma escala
            </button>
          </fieldset>
          <p id="comparison-scale-note">
            {framingNote(state.framing, trueSizeAvailable)}
          </p>
        </div>
      </section>
      <fieldset
        className="comparison-mobile-switch"
        aria-label="Lado visible de la comparación"
      >
        {(['left', 'right'] as const).map((side) => (
          <button
            key={side}
            aria-pressed={state.activeSide === side}
            onClick={() =>
              setState((current) => setComparisonActiveSide(current, side))
            }
          >
            {side === 'left' ? 'A · Izquierda' : 'B · Derecha'}
          </button>
        ))}
      </fieldset>
      <div className="comparison-divider" aria-hidden="true" />
      <ComparisonViewer key={viewerRevision} state={viewerState} />
      <div className="sr-only" aria-live="polite">
        Comparando {partNameEs(leftItem)} con {partNameEs(rightItem)}.
      </div>
      <Disassembly
        level={state.left}
        explode={state.explode}
        logical={logical}
        playing={playing}
        onToggleAuto={toggleAuto}
        onSetExplode={setExplode}
        onReset={reset}
        sectionLabel="Controles de desmontaje compartidos"
        title={disassemblyTitle(leftItem, rightItem)}
        sliderLabel="Desmontar o expandir ambos modelos"
        valueText={`${Math.round(state.explode)} por ciento para ambos modelos`}
      />
      <ComparisonSpecs
        left={state.left}
        right={state.right}
        open={state.specsOpen}
        returnFocusRef={specsButton}
        onOpenChange={(open) =>
          setState((current) => setComparisonSpecsOpen(current, open))
        }
      />
      {picker && (
        <ComparisonPicker
          key={`${picker}:${state[picker]}`}
          side={picker}
          selected={state[picker]}
          other={state[otherSide(picker)]}
          returnFocusRef={selectorButtons[picker]}
          onChoose={choose}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
  );
}
