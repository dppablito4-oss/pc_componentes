'use client';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { EyeOff } from 'lucide-react';
import { airflowShown } from '@/lib/airflow-policy';
import { levelPath, levels } from '@/lib/levels';
import { useExplorer } from './use-explorer';
import { useFirstVisitHint } from './use-first-visit-hint';
import { useBuildWorkspace } from './use-build-workspace';
import Viewer from './viewer';
import PerformanceTip from './performance-tip';
import Topbar, { type Accent } from './topbar';
import { useIsMobile } from '@/hooks/use-mobile';
import ScaleNav from './scale-nav';
import SystemsList from './systems-list';
import StageHeading from './stage-heading';
import StageTools from './stage-tools';
import PowerControls from './power-controls';
import Disassembly from './disassembly';
import DetailPanel from './detail-panel';
import AboutDialog from './about-dialog';
import ComparisonWorkbench from './comparison-workbench';

/**
 * The build workspace is its own download: most visits never open it, and
 * its parts list, checks and stylesheet would otherwise ride in the first
 * one. It is fetched once the explorer has drawn and the page is idle, so
 * opening it does not wait on the network.
 */
const loadBuildWorkspace = () => import('./build-workspace');
const BuildWorkspace = lazy(loadBuildWorkspace);
/** Off the first download too: most visits never open it. */
const FeedbackDialog = lazy(() => import('./feedback-dialog'));
const SearchDialog = lazy(() => import('./search-dialog'));

export default function Home() {
  const explorer = useExplorer();
  const { state, selected, logical, layers, selectConcept, choose, navigate } =
    explorer;
  const [search, setSearch] = useState(false),
    [query, setQuery] = useState(''),
    [about, setAbout] = useState(false),
    // `null` until the form is first asked for, which is when it is fetched.
    // After that it stays mounted, which is what keeps an unsent draft.
    [feedback, setFeedback] = useState<boolean | null>(null),
    [comparing, setComparing] = useState(false),
    // `null` until the viewer has reported for the first time. Zero means the
    // viewer is running and nothing is switched on, which is a different thing
    // to say to the reader, and saying the wrong one was what put "No
    // structures visible" on screen for the whole of a cold load.
    [count, setCount] = useState<number | null>(null);
  const mobile = useIsMobile(960);
  const [desktopLayers, setDesktopLayers] = useState(true);
  const [inspectorOverride, setInspectorOverride] = useState<{
    selection: typeof state.selection;
    open: boolean;
  } | null>(null);
  const [accent, setAccent] = useState<Accent>('#F97316');
  const explorerOpen = mobile ? layers : desktopLayers;
  const inspectorOpen =
    !(mobile && layers) &&
    (inspectorOverride?.selection === state.selection
      ? inspectorOverride.open
      : Boolean(selected));

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', accent);
    root.toggleAttribute('data-custom-accent', accent !== '#F97316');
    return () => {
      root.style.removeProperty('--accent-primary');
      root.removeAttribute('data-custom-accent');
    };
  }, [accent]);

  const building = state.workspace === 'build';
  const workspace = useBuildWorkspace(explorer);
  const { pointAt } = workspace;
  const viewerState = useMemo(
    () => ({ ...workspace.viewerState, selectionAccent: accent }),
    [workspace.viewerState, accent],
  );
  const drawn = count !== null;
  useEffect(() => {
    if (!drawn) return;
    if (typeof requestIdleCallback === 'undefined') {
      const timer = setTimeout(loadBuildWorkspace, 1500);
      return () => clearTimeout(timer);
    }
    const idle = requestIdleCallback(loadBuildWorkspace, { timeout: 4000 });
    return () => cancelIdleCallback(idle);
  }, [drawn]);

  const { hint, dismissHint } = useFirstVisitHint(
    state,
    count !== null && count > 0,
  );

  /** Jump to a component, closing the palette if that is where it came from. */
  const selectResult = useCallback(
    (id: string) => {
      selectConcept(id);
      setSearch(false);
      setQuery('');
    },
    [selectConcept],
  );

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (comparing) return;
      // A key pressed while nothing is focused reports the document, not an
      // element, and on some soft keyboards the target is the window itself.
      // Reaching for closest() on either throws out of the handler.
      const el = event.target;
      if (
        el instanceof Element &&
        el.closest('input,textarea,[contenteditable=true]')
      )
        return;
      if (search || about || feedback) return;
      if (building) {
        if (event.key === 'Escape') pointAt(null);
        return;
      }
      if (event.key === '/') {
        event.preventDefault();
        setSearch(true);
      }
      if (event.key === 'Escape') {
        choose(null);
        setInspectorOverride(null);
      }
      if (event.key === 'Backspace') {
        const currentPath = levelPath(state.level);
        if (currentPath.length > 1) {
          event.preventDefault();
          navigate(currentPath[currentPath.length - 2]);
        }
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [
    about,
    building,
    choose,
    comparing,
    feedback,
    navigate,
    pointAt,
    search,
    state.level,
  ]);

  if (comparing)
    return (
      <ComparisonWorkbench
        initialLevel={state.level}
        onExit={() => {
          setComparing(false);
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLButtonElement>('.compare-button')
              ?.focus(),
          );
        }}
      />
    );

  // The viewer keeps its place among its siblings in both layouts, so React
  // keeps the same scene when the workspace opens or closes.
  return (
    <main
      className={
        'workbench' +
        (building
          ? ' build-workbench'
          : ' explorer-workbench' +
            (explorerOpen ? ' explorer-open' : '') +
            (inspectorOpen ? ' inspector-open' : '') +
            (logical ? ' logical' : ''))
      }
    >
      {building ? (
        <Suspense fallback={null}>
          <BuildWorkspace
            build={state.build}
            fitting={workspace.fitting}
            focus={workspace.focus}
            airflow={airflowShown(state.airflow, state.level)}
            power={state.power}
            onSetPart={workspace.choosePart}
            onRestore={explorer.restoreBuild}
            onExit={() => {
              workspace.leave();
              requestAnimationFrame(() =>
                document
                  .querySelector<HTMLButtonElement>('.build-button')
                  ?.focus(),
              );
            }}
            onToggleAirflow={explorer.toggleAirflow}
            onTogglePower={explorer.togglePower}
          />
        </Suspense>
      ) : (
        <>
          <Topbar
            layers={explorerOpen}
            inspector={inspectorOpen}
            accent={accent}
            onAccentChange={setAccent}
            onReset={explorer.reset}
            onToggleLayers={() => {
              if (mobile) explorer.setLayers(!layers);
              else setDesktopLayers((open) => !open);
            }}
            onToggleInspector={() => {
              if (mobile) explorer.setLayers(false);
              setInspectorOverride({
                selection: state.selection,
                open: !inspectorOpen,
              });
            }}
            onSearch={() => setSearch(true)}
            onAbout={() => setAbout(true)}
            onFeedback={() => setFeedback(true)}
          />
          <PerformanceTip ready={count !== null && count > 0} />
          {mobile &&
            layers && (
              // Without this the drawer floats over a live 3-D view: a tap
              // meant to dismiss it lands in the scene and selects whatever was
              // behind it.
              <button
                className="drawer-scrim"
                aria-label="Cerrar sistemas"
                onClick={() => explorer.setLayers(false)}
              />
            )}
          <aside
            className={'explorer' + (mobile && layers ? ' mobile-open' : '')}
            id="explorer-panel"
            aria-label="Explorador"
            hidden={!explorerOpen}
          >
            <ScaleNav
              level={state.level}
              shownMenu={explorer.shownMenu}
              shownSubmenu={explorer.shownSubmenu}
              onOpenMenu={explorer.showMenu}
              onOpenSubmenu={explorer.showSubmenu}
              onNavigate={navigate}
              onCompare={() => setComparing(true)}
              onBuild={explorer.openBuild}
              onClose={() => explorer.setLayers(false)}
            />
            <SystemsList
              level={state.level}
              visible={state.visible}
              hidden={state.hidden}
              onToggleCategory={explorer.toggleCategory}
              onHideAll={explorer.hideAllCategories}
              onShowAll={explorer.showEverything}
              onSetConceptVisible={explorer.setConceptVisible}
              onSelectConcept={selectResult}
            />
          </aside>
          <StageHeading
            navigation={explorer.navigation}
            level={state.level}
            explode={state.explode}
            logical={logical}
            selected={selected}
            hint={hint}
            onDismissHint={dismissHint}
            onNavigate={navigate}
          />
        </>
      )}
      <Viewer
        state={viewerState}
        loading={count === null}
        onSelect={building ? pointAt : choose}
        onCount={setCount}
        onDived={explorer.arrive}
        hoverHint={building ? 'Haz clic para ubicar la pieza' : undefined}
      />
      {building ? null : (
        <>
          {count === 0 && (
            <div className="empty-scene">
              <EyeOff size={27} />
              <h3>No hay componentes visibles</h3>
              <button onClick={explorer.showEverything}>
                Mostrar todos los sistemas
              </button>
            </div>
          )}
          <StageTools
            view={state.view}
            level={state.level}
            explode={state.explode}
            logical={logical}
            airflow={state.airflow}
            hidden={state.hidden}
            hiddenMenuOpen={explorer.hiddenMenuOpen}
            onToggleHiddenMenu={() =>
              explorer.setHiddenMenuOpen((open) => !open)
            }
            onSetView={explorer.setView}
            onToggleAirflow={explorer.toggleAirflow}
            onUnhide={explorer.unhide}
            onClearHidden={explorer.clearHidden}
          >
            <PowerControls
              state={state}
              onToggle={explorer.togglePower}
              onTarget={explorer.setPowerTarget}
              onInspect={(id) => choose({ concept: id })}
            />
          </StageTools>
          <Disassembly
            level={state.level}
            explode={state.explode}
            logical={logical}
            playing={explorer.playing}
            onToggleAuto={explorer.toggleAuto}
            onSetExplode={explorer.setExplode}
            onReset={explorer.resetView}
            compact
          />
          {search && (
            <Suspense fallback={null}>
              <SearchDialog
                open={search}
                onOpenChange={setSearch}
                query={query}
                onQueryChange={setQuery}
                onSelect={selectResult}
              />
            </Suspense>
          )}
          <DetailPanel
            open={inspectorOpen}
            selected={selected}
            selection={state.selection}
            opens={explorer.opens}
            level={state.level}
            isolated={state.isolated}
            onClose={() => {
              setInspectorOverride({ selection: null, open: false });
              choose(null);
              document
                .querySelector<HTMLElement>('[aria-controls="part-inspector"]')
                ?.focus();
            }}
            onSelectConcept={selectResult}
            onDive={explorer.dive}
            onIsolate={explorer.toggleIsolate}
            onFocus={explorer.refocus}
            onHide={explorer.hide}
          />
        </>
      )}
      <AboutDialog open={about} onOpenChange={setAbout} />
      {feedback !== null && (
        <Suspense fallback={null}>
          <FeedbackDialog
            open={feedback}
            onOpenChange={setFeedback}
            context={() => ({
              page: window.location.href,
              selection: selected
                ? `${selected.name} (${levels[state.level].name})`
                : levels[state.level].name,
              language: document.documentElement.lang || 'es',
            })}
          />
        </Suspense>
      )}
    </main>
  );
}
