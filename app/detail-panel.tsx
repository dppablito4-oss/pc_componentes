'use client';
import {
  ArrowUpRight,
  ChevronRight,
  EyeOff,
  Focus,
  Maximize,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { byId, sources, type Concept } from '@/lib/manifest';
import { hueOfLevel, hueOfSystem, hueStyle } from '@/lib/palette';
import type { Selection } from '@/lib/explorer-state';
import { type LevelId } from '@/lib/levels';
import {
  bilingualPartName,
  categoryEs,
  componentDescriptionEs,
  levelNameEs,
  partNameEs,
  specificationNameEs,
} from '@/lib/locale-es';

type Props = {
  /** What the selected piece describes: in a custom build, the part installed. */
  selected: Concept | null;
  selection: Selection | null;
  /** The scale opening the selected piece leads to. */
  opens: LevelId | null;
  level: LevelId;
  isolated: boolean;
  onClose: () => void;
  onSelectConcept: (id: string) => void;
  onDive: (id: string) => void;
  onIsolate: () => void;
  onFocus: () => void;
  onHide: (id: string) => void;
};

export default function DetailPanel({
  selected,
  selection,
  opens,
  level,
  isolated,
  onClose,
  onSelectConcept,
  onDive,
  onIsolate,
  onFocus,
  onHide,
}: Props) {
  // Actions apply to the piece on stage, which keeps its own id whatever part
  // it describes.
  const piece = selection?.concept ?? selected?.id;
  const description = selected
    ? componentDescriptionEs[selected.id]
    : undefined;
  return (
    <Sheet
      open={!!selected}
      modal={false}
      onOpenChange={(open, details) => {
        if (!open && details.reason !== 'outside-press') onClose();
      }}
    >
      <SheetContent
        className="detail-panel"
        style={selected ? hueStyle(hueOfSystem(selected.category)) : undefined}
        side="right"
        showCloseButton={false}
        initialFocus={false}
      >
        {selected && (
          <>
            <div className="detail-top">
              <span className="detail-kind">
                <i aria-hidden="true" />
                {categoryEs[selected.category]} /{' '}
                {selected.representationType === 'logical'
                  ? 'Arquitectura'
                  : 'Hardware'}
              </span>
              <button
                aria-label="Cerrar ficha del componente"
                onClick={onClose}
              >
                <X size={17} />
              </button>
            </div>
            <SheetTitle>{partNameEs(selected)}</SheetTitle>
            <p className="part-english" lang="en">
              {selected.name}
            </p>
            <div className="instance-label">
              {selection?.instance !== undefined
                ? 'Pieza ' + String(selection.instance + 1).padStart(2, '0')
                : 'Grupo de componentes'}
            </div>
            <SheetDescription className={description ? undefined : 'sr-only'}>
              {description ?? 'Especificaciones y fuentes del componente.'}
            </SheetDescription>
            <dl>
              {Object.entries(selected.specifications).map(([k, v]) => (
                <div key={k}>
                  <dt title={k}>{specificationNameEs(k)}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {selected.parent && (
              <div className="parent-link">
                Pertenece a{' '}
                <button
                  title={bilingualPartName(byId[selected.parent])}
                  onClick={() => onSelectConcept(selected.parent!)}
                >
                  {partNameEs(byId[selected.parent], true)}
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
            {opens && opens !== level && (
              <button
                className="open-component"
                style={hueStyle(hueOfLevel(opens))}
                onClick={() => onDive(piece!)}
              >
                Explorar {levelNameEs(opens)}
                <ChevronRight size={17} />
              </button>
            )}
            <div className="detail-actions">
              <button onClick={onIsolate}>
                <Focus size={14} />
                {isolated ? 'Mostrar entorno' : 'Aislar'}
              </button>
              <button onClick={onFocus}>
                <Maximize size={14} />
                Enfocar
              </button>
              <button onClick={() => onHide(piece!)}>
                <EyeOff size={14} />
                Ocultar
              </button>
            </div>
            <details className="part-original-notes">
              <summary>Descripción técnica en inglés</summary>
              <div lang="en">
                <p>{selected.description}</p>
                <p>{selected.purpose}</p>
                <p>{selected.quantity}</p>
                <p className="accuracy">{selected.physicalAccuracy}</p>
              </div>
            </details>
            {selected.sources.length > 0 && (
              <div className="source-links">
                <h3>Fuentes y arquitectura</h3>
                <p>
                  Consulta la documentación del fabricante y los estándares
                  técnicos.
                </p>
                {selected.sources.map((s) => (
                  <a
                    key={s}
                    href={sources[s].url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {sources[s].name}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
