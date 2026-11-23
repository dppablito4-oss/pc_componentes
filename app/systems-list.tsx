'use client';
import { systemRoot, type LevelId } from '@/lib/levels';
import { useState } from 'react';
import {
  Check,
  ChevronDown,
  CircuitBoard,
  Cpu,
  Eye,
  Fan,
  Gpu,
  HardDrive,
  MemoryStick,
  PcCase,
  Zap,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { categories, manifest, type Category } from '@/lib/manifest';
import { bilingualPartName, categoryEs, partNameEs } from '@/lib/locale-es';
import { hueOfSystem, hueStyle } from '@/lib/palette';

const systemIcons = {
  Chassis: PcCase,
  Cooling: Fan,
  Board: CircuitBoard,
  Power: Zap,
  Memory: MemoryStick,
  Storage: HardDrive,
  Compute: Cpu,
  Graphics: Gpu,
};

type Props = {
  level: LevelId;
  visible: Category[];
  hidden: string[];
  onToggleCategory: (category: Category) => void;
  onHideAll: () => void;
  onShowAll: () => void;
  onSetConceptVisible: (
    id: string,
    category: Category,
    visible: boolean,
  ) => void;
  onSelectConcept: (id: string) => void;
};

export default function SystemsList({
  level,
  visible,
  hidden,
  onToggleCategory,
  onHideAll,
  onShowAll,
  onSetConceptVisible,
  onSelectConcept,
}: Props) {
  // Which system is unfolded to show its parts. Nothing outside this list
  // cares, so it stays here rather than in the explorer's own state.
  const [expanded, setExpanded] = useState<Category | null>(null);
  return (
    <div className="systems-section">
      <div className="section-heading">
        <span className="systems-title">
          <Eye size={13} aria-hidden="true" /> Sistemas visibles
        </span>
        <div className="systems-actions">
          {visible.length > 0 && (
            <button onClick={onHideAll}>Ocultar todo</button>
          )}
          {(visible.length < categories.length || hidden.length > 0) && (
            <button onClick={onShowAll}>Mostrar todo</button>
          )}
        </div>
      </div>
      <div className="layer-scroll">
        {categories.map((category) => {
          const Icon = systemIcons[category];
          const enabled = visible.includes(category);
          return (
            <div key={category} style={hueStyle(hueOfSystem(category))}>
              <div className="layer-row">
                <label className="category-visibility">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={enabled}
                    onChange={() => onToggleCategory(category)}
                  />
                  <span className="system-check" aria-hidden="true">
                    {enabled && <Check size={10} strokeWidth={3} />}
                  </span>
                  <Icon className="system-icon" size={16} aria-hidden="true" />
                  <span>{categoryEs[category]}</span>
                </label>
                <button
                  className="category-expand"
                  onClick={() =>
                    setExpanded(expanded === category ? null : category)
                  }
                  aria-expanded={expanded === category}
                  aria-label={
                    (expanded === category ? 'Ocultar' : 'Mostrar') +
                    ' componentes de ' +
                    categoryEs[category]
                  }
                >
                  <ChevronDown size={12} />
                </button>
              </div>
              {expanded === category && (
                <div className="sublayers">
                  {manifest
                    .filter(
                      (c) =>
                        c.category === category &&
                        c.open !== c.level &&
                        systemRoot(c.level) === systemRoot(level),
                    )
                    .map((c) => (
                      <div key={c.id}>
                        <button
                          title={bilingualPartName(c)}
                          onClick={() => onSelectConcept(c.id)}
                        >
                          {partNameEs(c, true)}
                        </button>
                        <Switch
                          size="sm"
                          checked={
                            visible.includes(category) && !hidden.includes(c.id)
                          }
                          onCheckedChange={(checked) =>
                            onSetConceptVisible(c.id, category, checked)
                          }
                          aria-label={
                            (visible.includes(category) &&
                            !hidden.includes(c.id)
                              ? 'Ocultar '
                              : 'Mostrar ') + partNameEs(c)
                          }
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
