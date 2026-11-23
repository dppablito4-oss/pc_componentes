'use client';
import { useRef, type RefObject } from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  comparisonItem,
  comparisonRows,
  sharesSpecTable,
  type ComparisonItem,
  type ComparisonLevel,
} from '@/lib/comparison-state';
import { byId } from '@/lib/manifest';
import {
  bilingualPartName,
  levelNameEs,
  partNameEs,
  specificationNameEs,
} from '@/lib/locale-es';
import { levels } from '@/lib/levels';
import { sources } from '@/lib/sources';

type Props = {
  left: ComparisonLevel;
  right: ComparisonLevel;
  open: boolean;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onOpenChange: (open: boolean) => void;
};

type Pair = readonly [ComparisonItem, ComparisonItem];
const letters = ['A', 'B'] as const;

function SpecValue({ value }: { value: string | null }) {
  return value ?? <span className="spec-unlisted">Sin datos</span>;
}

/** Like parts: one row per field label, gaps left visible. */
function SpecTable({ pair }: { pair: Pair }) {
  const [left, right] = pair;
  const rows = comparisonRows(left.level, right.level);
  return (
    <>
      <table className="comparison-specs-grid">
        <thead>
          <tr className="spec-row spec-head">
            <th scope="col">Especificación</th>
            <th scope="col">A · {partNameEs(left, true)}</th>
            <th scope="col">B · {partNameEs(right, true)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const different = Boolean(
              row.left && row.right && row.left !== row.right,
            );
            return (
              <tr
                className="spec-row"
                key={row.id}
                data-different={different || undefined}
              >
                <th scope="row" title={row.label}>
                  {specificationNameEs(row.label)}
                </th>
                <td>
                  <SpecValue value={row.left} />
                </td>
                <td>
                  <SpecValue value={row.right} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && (
        <p className="comparison-specs-note">
          No hay especificaciones para estos modelos.
        </p>
      )}
    </>
  );
}

/** Unlike parts: each model's own fields, with no forced alignment. */
function SpecCards({ pair }: { pair: Pair }) {
  return (
    <div className="comparison-independent-specs">
      {pair.map((item, index) => (
        <section className="comparison-spec-card" key={item.level}>
          <h3>
            {letters[index]} · {partNameEs(item)}
          </h3>
          <p>
            {levelNameEs(item.system)} ·{' '}
            {item.kind === 'physical' ? 'Hardware' : 'Diagrama de arquitectura'}
          </p>
          <dl>
            {item.specs.map((spec) => (
              <div key={spec.id}>
                <dt title={spec.label}>{specificationNameEs(spec.label)}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
          {!item.specs.length && (
            <p>No hay especificaciones para este modelo.</p>
          )}
        </section>
      ))}
    </div>
  );
}

/** Each model's modelling-accuracy note and cited sources. */
function SourceNotes({ pair }: { pair: Pair }) {
  return (
    <div className="comparison-source-notes">
      {pair.map((item, index) => {
        const concept = byId[levels[item.level].concept];
        return (
          <section key={item.level}>
            <h3>
              {letters[index]} · {bilingualPartName(item)}
            </h3>
            <p>{concept.physicalAccuracy}</p>
            <ul>
              {concept.sources.map((id) => (
                <li key={id}>
                  <a href={sources[id].url} target="_blank" rel="noreferrer">
                    {sources[id].name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function ComparisonSpecs({
  left,
  right,
  open,
  returnFocusRef,
  onOpenChange,
}: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const pair: Pair = [comparisonItem(left), comparisonItem(right)];
  const aligned = sharesSpecTable(left, right);
  return (
    <Sheet open={open} modal={false} onOpenChange={onOpenChange}>
      <SheetContent
        className="comparison-specs"
        side="right"
        showCloseButton={false}
        initialFocus={closeButton}
        finalFocus={returnFocusRef}
      >
        <div className="comparison-specs-heading">
          <div>
            <SheetTitle>Comparación de especificaciones</SheetTitle>
            <SheetDescription>
              {aligned
                ? 'La tabla alinea las especificaciones comunes de los dos modelos.'
                : 'Cada pieza muestra sus propias especificaciones.'}
            </SheetDescription>
          </div>
          <button
            ref={closeButton}
            aria-label="Cerrar comparación de especificaciones"
            onClick={() => onOpenChange(false)}
          >
            <X size={18} />
          </button>
        </div>
        {aligned ? <SpecTable pair={pair} /> : <SpecCards pair={pair} />}
        <SourceNotes pair={pair} />
      </SheetContent>
    </Sheet>
  );
}
