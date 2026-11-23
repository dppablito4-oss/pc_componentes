'use client';
import { useMemo, useRef, useState, type RefObject } from 'react';
import { Check, Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  comparisonCategories,
  comparisonItem,
  comparisonCategoryEs,
  filterComparisonItems,
  otherSide,
  sideLetter,
  type ComparisonCategoryId,
  type ComparisonItem,
  type ComparisonLevel,
  type ComparisonSide,
} from '@/lib/comparison-state';
import { levelPath, systemRoots } from '@/lib/levels';
import { levelNameEs, partNameEs } from '@/lib/locale-es';
import { hueOfCategory, hueStyle } from '@/lib/palette';

type Props = {
  side: ComparisonSide;
  selected: ComparisonLevel;
  other: ComparisonLevel;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onChoose: (level: ComparisonLevel) => void;
  onClose: () => void;
};

type ResultProps = {
  item: ComparisonItem;
  selected: boolean;
  /** Set when the other side already shows this model. */
  takenBy: string | null;
  onChoose: () => void;
};

function PickerResult({ item, selected, takenBy, onChoose }: ResultProps) {
  return (
    <li>
      <button
        data-level={item.level}
        disabled={takenBy !== null}
        aria-pressed={selected}
        onClick={onChoose}
      >
        <span className="comparison-result-copy">
          <strong>{partNameEs(item)}</strong>
          <span className="part-english" lang="en">
            {item.name}
          </span>
          <small>{levelPath(item.level).map(levelNameEs).join(' / ')}</small>
        </span>
        <span className="comparison-result-kind">
          {takenBy
            ? `En ${takenBy}`
            : item.kind === 'logical'
              ? 'Diagrama'
              : 'Hardware'}
        </span>
        {selected && <Check size={16} aria-label="Seleccionada" />}
      </button>
    </li>
  );
}

/**
 * Category, system and search filters combine. The counts beside each
 * category follow the system and search filters, so a reader can see where
 * the matches are before switching category.
 */
export default function ComparisonPicker({
  side,
  selected,
  other,
  returnFocusRef,
  onChoose,
  onClose,
}: Props) {
  const search = useRef<HTMLInputElement>(null);
  // Open on the current part's category; "All parts" is one click away.
  const [category, setCategory] = useState<ComparisonCategoryId | undefined>(
    comparisonItem(selected).category,
  );
  const [system, setSystem] = useState<ComparisonLevel | undefined>();
  const [query, setQuery] = useState('');
  const matches = useMemo(
    () => filterComparisonItems({ system, query }),
    [system, query],
  );
  const countIn = (id: ComparisonCategoryId) =>
    matches.filter((item) => item.category === id).length;
  const results = category
    ? matches.filter((item) => item.category === category)
    : matches;
  const groups = comparisonCategories
    .map((entry) => ({
      ...entry,
      items: results.filter((item) => item.category === entry.id),
    }))
    .filter((entry) => entry.items.length);
  const clear = () => {
    setCategory(undefined);
    setSystem(undefined);
    setQuery('');
    search.current?.focus();
  };
  const otherLetter = sideLetter(otherSide(side));
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="comparison-picker"
        showCloseButton={false}
        initialFocus={search}
        finalFocus={returnFocusRef}
      >
        <header className="comparison-picker-heading">
          <div>
            <DialogTitle>Elegir pieza {sideLetter(side)}</DialogTitle>
            <DialogDescription>
              Selecciona un componente de cualquier equipo.
            </DialogDescription>
          </div>
          <button aria-label="Cerrar selector de piezas" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div className="comparison-picker-filters">
          <label className="comparison-search">
            <Search size={17} aria-hidden="true" />
            <input
              ref={search}
              aria-label="Buscar piezas"
              placeholder="Buscar piezas, modelos o arquitectura…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="comparison-system-filter">
            <span>Equipo</span>
            <select
              aria-label="Equipo"
              value={system ?? 'all'}
              onChange={(event) =>
                setSystem(
                  event.target.value === 'all'
                    ? undefined
                    : (event.target.value as ComparisonLevel),
                )
              }
            >
              <option value="all">Todos los equipos</option>
              {systemRoots.map((root) => (
                <option key={root} value={root}>
                  {levelNameEs(root)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="comparison-picker-body">
          <nav
            className="comparison-category-nav"
            aria-label="Categorías de piezas"
          >
            <button
              aria-pressed={!category}
              style={hueStyle('system')}
              onClick={() => setCategory(undefined)}
            >
              Todas las piezas <span aria-hidden="true">{matches.length}</span>
            </button>
            {comparisonCategories.map((entry) => (
              <button
                key={entry.id}
                aria-pressed={category === entry.id}
                style={hueStyle(hueOfCategory(entry.id))}
                onClick={() => setCategory(entry.id)}
              >
                <i aria-hidden="true" />
                {comparisonCategoryEs[entry.id]}
                <span aria-hidden="true">{countIn(entry.id)}</span>
              </button>
            ))}
          </nav>
          <div className="comparison-results">
            <output className="comparison-result-count">
              {results.length} {results.length === 1 ? 'pieza' : 'piezas'}
            </output>
            {!results.length && (
              <div className="comparison-empty">
                <strong>No se encontraron piezas</strong>
                <p>Prueba con otra categoría, equipo o búsqueda.</p>
                <button onClick={clear}>Limpiar filtros</button>
              </div>
            )}
            {groups.map((group) => (
              <section
                key={group.id}
                aria-label={comparisonCategoryEs[group.id]}
                style={hueStyle(hueOfCategory(group.id))}
              >
                <h3>{comparisonCategoryEs[group.id]}</h3>
                <ul>
                  {group.items.map((item) => (
                    <PickerResult
                      key={item.level}
                      item={item}
                      selected={item.level === selected}
                      takenBy={item.level === other ? otherLetter : null}
                      onChoose={() => onChoose(item.level)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
