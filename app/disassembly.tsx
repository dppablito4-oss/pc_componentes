'use client';
import { PackageOpen, Pause, Play, RotateCcw } from 'lucide-react';
import { phaseEs } from '@/lib/locale-es';
import { Slider } from '@/components/ui/slider';
import { levels, type LevelId } from '@/lib/levels';

type Props = {
  level: LevelId;
  explode: number;
  logical: boolean;
  playing: boolean;
  onToggleAuto: () => void;
  onSetExplode: (value: number) => void;
  onReset: () => void;
  compact?: boolean;
  sectionLabel?: string;
  title?: string;
  sliderLabel?: string;
  valueText?: string;
};

export default function Disassembly({
  level,
  explode,
  logical,
  playing,
  onToggleAuto,
  onSetExplode,
  onReset,
  compact = false,
  sectionLabel = 'Controles de desmontaje',
  title,
  sliderLabel = 'Desmontar el modelo',
  valueText,
}: Props) {
  const phases = levels[level].phases,
    explodePercent = Math.round(explode);
  const inventory = phases.find(([, value]) => Number(value) === 100);
  return (
    <section className="disassembly" aria-label={sectionLabel}>
      <div className="disassembly-intro">
        <button
          className={
            'play' +
            (playing ? ' running' : '') +
            (!playing && explode < 1 ? ' idle' : '')
          }
          onClick={onToggleAuto}
          aria-label={
            playing
              ? 'Pausar desmontaje automático'
              : 'Desmontar automáticamente'
          }
          title={playing ? 'Pausar desmontaje' : 'Desmontar automáticamente'}
        >
          {playing ? <Pause size={23} /> : <Play size={23} />}
          <span>{playing ? 'Pausa' : 'Auto'}</span>
        </button>
        <div className="disassembly-label">
          <div>
            <strong>{title ?? (logical ? 'Expandir' : 'Desmontar')}</strong>
            <span>ARRASTRA O REPRODUCE</span>
          </div>
        </div>
      </div>
      <div className="timeline">
        <div className="phase-labels">
          {phases
            .filter((phase) => phase !== inventory)
            .map(([name, value]) => (
              <button
                key={name}
                className={
                  (
                    Number(value) === 0
                      ? explode < 13
                      : explode >= 13 && explode < 100
                  )
                    ? 'active'
                    : ''
                }
                onClick={() => onSetExplode(Number(value))}
              >
                {compact && Number(value) === 0
                  ? 'Montado'
                  : compact && !logical
                    ? 'Desmontaje'
                    : (phaseEs[name] ?? name)}
              </button>
            ))}
        </div>
        <Slider
          value={[explode]}
          onValueChange={(value) =>
            onSetExplode(Array.isArray(value) ? value[0] : value)
          }
          aria-label={sliderLabel}
          aria-valuetext={valueText ?? `${explodePercent} por ciento`}
        />
        <div className="ruler" aria-hidden="true">
          {Array.from({ length: 41 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <div className="disassembly-readout">
        {inventory && (
          <button
            type="button"
            className="inventory-button"
            aria-pressed={explode === 100}
            onClick={() => onSetExplode(Number(inventory[1]))}
          >
            <PackageOpen size={16} aria-hidden="true" />
            {phaseEs[inventory[0]] ?? inventory[0]}
          </button>
        )}
        <output>{explodePercent}%</output>
        <button
          className="reset"
          aria-label="Restablecer cámara y montaje"
          onClick={onReset}
        >
          <RotateCcw size={18} />
          <span>Reiniciar</span>
        </button>
      </div>
    </section>
  );
}
