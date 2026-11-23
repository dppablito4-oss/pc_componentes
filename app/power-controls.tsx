'use client';
import { useState } from 'react';
import { Zap } from 'lucide-react';
import {
  hasPowerFlow,
  powerPanelState,
  type PowerTarget,
} from '@/lib/power-flow-policy';
import type { ExplorerState } from '@/lib/explorer-state';

const targets: { id: PowerTarget; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'cpu', label: 'CPU' },
  { id: 'gpu', label: 'GPU' },
  { id: 'storage', label: 'Discos' },
];

export default function PowerControls({
  state,
  onToggle,
  onTarget,
  onInspect,
}: {
  state: ExplorerState;
  onToggle: () => void;
  onTarget: (target: PowerTarget) => void;
  onInspect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!hasPowerFlow(state.level)) return null;
  const { routes, visible, explanation, status } = powerPanelState(state);
  return (
    <>
      <button
        className={
          'airflow-toggle power-toggle' + (state.power ? ' active' : '')
        }
        aria-label={
          state.power
            ? 'Ocultar flujo de alimentación'
            : 'Mostrar flujo de alimentación'
        }
        aria-pressed={state.power}
        aria-controls="power-flow-panel"
        title="Sigue la alimentación desde la fuente a cada pieza"
        onClick={onToggle}
      >
        <Zap size={15} />
        <span>Energía</span>
        <small>{state.power ? 'Sí' : 'No'}</small>
      </button>
      {state.power && (
        <section
          className={'power-panel' + (expanded ? ' expanded' : '')}
          id="power-flow-panel"
          aria-label="Flujo de alimentación"
        >
          <div className="power-heading">
            <strong>Recorrido de la energía</strong>
            <span>DESDE LA FUENTE</span>
            <button
              className="power-legend-toggle"
              aria-expanded={expanded}
              aria-controls="power-legend"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? 'Menos' : 'Detalles'}
            </button>
          </div>
          <fieldset
            className="power-targets"
            aria-label="Destino de la alimentación"
          >
            {targets.map((target) => (
              <button
                key={target.id}
                aria-pressed={state.powerTarget === target.id}
                onClick={() => onTarget(target.id)}
              >
                {target.label}
              </button>
            ))}
          </fieldset>
          {status && <output className="power-status">{status}</output>}
          <ul className="power-legend" id="power-legend">
            {routes.map((route) => (
              <li
                key={route.id}
                className={!visible.includes(route.id) ? 'power-muted' : ''}
              >
                <i style={{ background: route.color }} aria-hidden="true" />
                <button
                  onClick={() => onInspect(route.inspect)}
                  title={route.description}
                  aria-label={`Inspeccionar ${route.destination}: ${route.label}`}
                >
                  <span>
                    <strong>{route.label}</strong>
                    <small>{route.voltage}</small>
                  </span>
                  <span className="power-destination">
                    {route.destination} →
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {explanation && <p className="power-explanation">{explanation}</p>}
          <p className="power-note">
            Los colores distinguen las rutas y las flechas indican el sentido.
            La línea discontinua representa la alimentación a través de la
            placa.
          </p>
        </section>
      )}
    </>
  );
}
