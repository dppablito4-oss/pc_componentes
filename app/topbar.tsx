'use client';
import {
  BookOpen,
  Box,
  ChevronDown,
  Info,
  MessageSquare,
  PanelLeft,
  PanelRight,
  Search,
} from 'lucide-react';
import { GUIDE } from './links';

export const accents = {
  '#F97316': 'Naranja',
  '#10B981': 'Esmeralda',
  '#3B82F6': 'Azul CAD',
  '#8B5CF6': 'Violeta',
} as const;

export type Accent = keyof typeof accents;

type Props = {
  layers: boolean;
  inspector: boolean;
  accent: Accent;
  onAccentChange: (accent: Accent) => void;
  onReset: () => void;
  onToggleLayers: () => void;
  onToggleInspector: () => void;
  onSearch: () => void;
  onAbout: () => void;
  onFeedback: () => void;
};

export default function Topbar({
  layers,
  inspector,
  accent,
  onAccentChange,
  onReset,
  onToggleLayers,
  onToggleInspector,
  onSearch,
  onAbout,
  onFeedback,
}: Props) {
  return (
    <header className="topbar">
      <button
        className="brand"
        onClick={onReset}
        aria-label="Restablecer PC Anatomy"
      >
        <span className="brand-icon">
          <Box size={18} aria-hidden="true" />
        </span>
        <span>PC Anatomy</span>
      </button>
      <button
        className="search-button"
        aria-label="Buscar un componente"
        onClick={onSearch}
        title="Buscar componentes (/)"
      >
        <Search size={15} />
        <span>Buscar componentes</span>
        <kbd>/</kbd>
      </button>
      <div className="header-actions">
        <button
          className="hud-icon feedback-button"
          onClick={onFeedback}
          aria-label="Comentarios"
          title="Comentarios"
        >
          <MessageSquare size={16} />
        </button>
        <a className="hud-icon" href={GUIDE} aria-label="Guía" title="Guía">
          <BookOpen size={16} />
        </a>
        <button
          className="hud-icon"
          aria-label="Acerca del visor y sus fuentes"
          title="Acerca del visor y créditos"
          onClick={onAbout}
        >
          <Info size={16} />
        </button>
        <label
          className="accent-picker hud-icon"
          title={`Color dominante · ${accents[accent]}`}
        >
          <span aria-hidden="true" />
          <ChevronDown size={11} aria-hidden="true" />
          <select
            aria-label="Color dominante"
            value={accent}
            onChange={(event) => onAccentChange(event.target.value as Accent)}
          >
            {Object.entries(accents).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="hud-icon panel-toggle"
          onClick={onToggleLayers}
          aria-label="Explorador"
          title={layers ? 'Colapsar explorador' : 'Expandir explorador'}
          aria-expanded={layers}
          aria-controls="explorer-panel"
        >
          <PanelLeft size={16} />
        </button>
        <button
          className="hud-icon panel-toggle"
          onClick={onToggleInspector}
          aria-label="Inspector de pieza"
          title={inspector ? 'Colapsar inspector' : 'Expandir inspector'}
          aria-expanded={inspector}
          aria-controls="part-inspector"
        >
          <PanelRight size={16} />
        </button>
      </div>
    </header>
  );
}
