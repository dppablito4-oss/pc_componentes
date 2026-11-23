'use client';
import {
  BookOpen,
  Box,
  Info,
  Layers3,
  MessageSquare,
  Search,
} from 'lucide-react';
import { GUIDE } from './links';

type Props = {
  layers: boolean;
  onReset: () => void;
  onToggleLayers: () => void;
  onSearch: () => void;
  onAbout: () => void;
  onFeedback: () => void;
};

export default function Topbar({
  layers,
  onReset,
  onToggleLayers,
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
          <Box size={26} aria-hidden="true" />
        </span>
        <span>PC Anatomy</span>
      </button>
      <span className="brand-caption">Anatomía interactiva de un PC</span>
      <div className="header-actions">
        {/* First and filled: the one control in the bar that is about the
            site rather than the hardware, so it should be found without
            looking for it. */}
        <button
          className="chip chip-accent feedback-button"
          onClick={onFeedback}
          title="Reporta un error, sugiere una idea o propón una colaboración"
        >
          <MessageSquare size={15} />
          {/* One of the two is hidden at a time, so the button's name is
              always the label that is showing. */}
          <span className="label-full">Comentarios</span>
          <span className="label-short">Opinar</span>
        </button>
        <a
          className="chip guide-link"
          href={GUIDE}
          title="Aprende sobre los componentes de una PC"
        >
          <BookOpen size={15} />
          <span>Guía</span>
        </a>
        <button
          className="mobile-layers"
          onClick={onToggleLayers}
          aria-label="Mostrar u ocultar sistemas"
          aria-expanded={layers}
        >
          <Layers3 size={19} />
        </button>
        <button
          className="search-button"
          aria-label="Buscar un componente"
          onClick={onSearch}
        >
          <Search size={16} />
          <span>Buscar componentes</span>
          <kbd>/</kbd>
        </button>
        <button
          className="chip info-button"
          aria-label="Acerca del visor y sus fuentes"
          title="Acerca del visor y créditos"
          onClick={onAbout}
        >
          <Info size={16} />
          <span>Acerca de</span>
        </button>
      </div>
    </header>
  );
}
