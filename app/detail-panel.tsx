'use client';
import { Tabs } from '@base-ui/react/tabs';
import {
  ArrowUpRight,
  ChevronRight,
  EyeOff,
  Focus,
  Maximize,
  X,
} from 'lucide-react';
import { byId, sources, type Concept } from '@/lib/manifest';
import type { Selection } from '@/lib/explorer-state';
import type { LevelId } from '@/lib/levels';
import {
  bilingualPartName,
  categoryEs,
  componentDescriptionEs,
  levelNameEs,
  partNameEs,
  specificationNameEs,
} from '@/lib/locale-es';

type Props = {
  open: boolean;
  selected: Concept | null;
  selection: Selection | null;
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
  open,
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
  // Actions use the scene ID even when a build has put a different part in that slot.
  const piece = selection?.concept ?? selected?.id;
  return (
    <aside
      id="part-inspector"
      className="detail-panel"
      aria-label="Inspector de pieza"
      hidden={!open}
    >
      <div className="detail-top">
        <span className="detail-kind">
          {selected ? categoryEs[selected.category] : 'Inspector de pieza'}
        </span>
        <button
          className="hud-icon"
          aria-label="Cerrar ficha del componente"
          title="Cerrar inspector"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
      {selected && piece ? (
        <>
          <h2 className="part-title">{partNameEs(selected)}</h2>
          <p className="part-english" lang="en">
            {selected.name}
          </p>
          {selection?.instance !== undefined && (
            <div className="instance-label">
              Pieza {String(selection.instance + 1).padStart(2, '0')}
            </div>
          )}
          <fieldset className="detail-actions" aria-label="Controles de pieza">
            <button
              onClick={onIsolate}
              aria-pressed={isolated}
              title={isolated ? 'Mostrar entorno' : 'Aislar pieza'}
            >
              <Focus size={14} />
              Aislar
            </button>
            <button onClick={onFocus}>
              <Maximize size={14} />
              Enfocar
            </button>
            <button onClick={() => onHide(piece)}>
              <EyeOff size={14} />
              Ocultar
            </button>
          </fieldset>
          {opens && opens !== level && (
            <button className="open-component" onClick={() => onDive(piece)}>
              Explorar {levelNameEs(opens)}
              <ChevronRight size={16} />
            </button>
          )}
          <Tabs.Root key={piece} defaultValue="properties">
            <Tabs.List
              className="inspector-tabs"
              aria-label="Información de la pieza"
            >
              <Tabs.Tab value="properties">Propiedades</Tabs.Tab>
              <Tabs.Tab value="documentation">Documentación</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="properties">
              <dl>
                {Object.entries(selected.specifications).map(([key, value]) => (
                  <div key={key}>
                    <dt title={key}>{specificationNameEs(key)}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {selected.parent && (
                <div className="parent-link">
                  Pertenece a
                  <button
                    title={bilingualPartName(byId[selected.parent])}
                    onClick={() => onSelectConcept(selected.parent!)}
                  >
                    {partNameEs(byId[selected.parent], true)}
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
              <details className="part-original-notes">
                <summary>Descripción</summary>
                {componentDescriptionEs[selected.id] && (
                  <p>{componentDescriptionEs[selected.id]}</p>
                )}
                <div lang="en">
                  <p>{selected.description}</p>
                  <p>{selected.purpose}</p>
                  <p>{selected.quantity}</p>
                  <p className="accuracy">{selected.physicalAccuracy}</p>
                </div>
              </details>
            </Tabs.Panel>
            <Tabs.Panel value="documentation">
              <div className="source-links">
                {selected.sources.length ? (
                  selected.sources.map((id) => (
                    <a
                      key={id}
                      href={sources[id].url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {sources[id].name}
                      <ArrowUpRight size={13} />
                    </a>
                  ))
                ) : (
                  <p>Esta pieza no tiene documentación enlazada.</p>
                )}
              </div>
            </Tabs.Panel>
          </Tabs.Root>
        </>
      ) : (
        <p className="inspector-empty">
          Selecciona una pieza para consultar sus propiedades.
        </p>
      )}
    </aside>
  );
}
