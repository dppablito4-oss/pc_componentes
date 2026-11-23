'use client';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ExplorerState } from '@/lib/explorer-state';
import { levelPath } from '@/lib/levels';
import {
  placeTitle,
  placeToSearch,
  searchToPlace,
  type Place,
} from '@/lib/deep-link';

/** How long the slider has to rest before its position is written down. */
const SETTLE_MS = 250;
const HISTORY_KEY = 'pcAnatomyStep';

function historyStep(state: History['state']): number {
  const step: unknown = state?.[HISTORY_KEY];
  return typeof step === 'number' ? step : 0;
}

function placeOf(state: ExplorerState): Place {
  return {
    level: state.level,
    selection: state.selection,
    explode: state.explode,
    build: state.build,
    ...(state.workspace === 'build' && { workspace: state.workspace }),
  };
}

function address(search: string) {
  return location.pathname + search + location.hash;
}

/**
 * Keeps the address bar on the place being shown, and the place on the
 * address bar when the back button moves it.
 *
 * Changing scale is a step you can take back, so it pushes a history entry,
 * and so does opening or leaving the build workspace. Selecting a part,
 * moving the slider or swapping a part in the build refines where you already
 * are, so it replaces the current entry instead; otherwise backing out of a
 * scale would first replay every part you had clicked on it. Those are also
 * settled before they are written, because playback changes the position
 * every frame and browsers throttle pages that rewrite history that often.
 *
 * A dive in flight is not a place yet: the address follows once it lands.
 */
export function useAddress(state: ExplorerState, goTo: (place: Place) => void) {
  const previous = useRef(placeOf(state));
  const [position, setPosition] = useState(() => {
    const step = historyStep(history.state);
    return { step, furthest: step };
  });
  const step = useRef(position.step);
  const furthest = useRef(position.furthest);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { level, selection, explode, diveInto, build, workspace } = state;

  useLayoutEffect(() => {
    if (diveInto) return;
    const place: Place = {
      level,
      selection,
      explode,
      build,
      ...(workspace === 'build' && { workspace }),
    };
    const search = placeToSearch(place);
    document.title = placeTitle(place);
    setCanonical(location.origin + location.pathname + search);
    const leaving = previous.current;
    previous.current = place;
    if (level !== leaving.level || place.workspace !== leaving.workspace) {
      // Save the last pose and selection even when navigation interrupts the
      // debounced URL update (for example, a quick click while dismantling).
      history.replaceState(
        { ...history.state, [HISTORY_KEY]: step.current },
        '',
        address(placeToSearch(leaving)),
      );
      step.current += 1;
      furthest.current = step.current;
      history.pushState({ [HISTORY_KEY]: step.current }, '', address(search));
      setPosition({ step: step.current, furthest: furthest.current });
      return;
    }
    if (search === location.search) return;
    settle.current = setTimeout(
      () =>
        history.replaceState(
          { ...history.state, [HISTORY_KEY]: step.current },
          '',
          address(search),
        ),
      SETTLE_MS,
    );
    return () => clearTimeout(settle.current);
  }, [level, selection, explode, diveInto, build, workspace]);

  useLayoutEffect(() => {
    const back = (event: PopStateEvent) => {
      clearTimeout(settle.current);
      const place = searchToPlace(location.search);
      previous.current = place;
      step.current = historyStep(event.state);
      furthest.current = Math.max(furthest.current, step.current);
      setPosition({ step: step.current, furthest: furthest.current });
      goTo(place);
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [goTo]);

  const move = useCallback(
    (direction: -1 | 1) => {
      if (direction === 1 && step.current >= furthest.current) return false;
      if (direction === -1 && step.current === 0) {
        const current = previous.current;
        const parent = levelPath(current.level).at(-2);
        if (!parent && !current.workspace) return false;
        goTo({
          level: parent ?? current.level,
          selection: null,
          explode: 0,
          build: current.build,
        });
        return true;
      }
      history.go(direction);
      return true;
    },
    [goTo],
  );

  useLayoutEffect(() => {
    const withinViewer = (event: MouseEvent) =>
      event.target instanceof Element &&
      event.target.closest('.workbench:not(.comparison-workbench)');
    // Chromium performs its native history action on release. Handling the
    // press would run the browser's second navigation after ours.
    const onRelease = (event: MouseEvent) => {
      if (!withinViewer(event)) return;
      const direction = event.button === 3 ? -1 : event.button === 4 ? 1 : null;
      if (direction && move(direction)) event.preventDefault();
    };
    const onAuxClick = (event: MouseEvent) => {
      if (withinViewer(event) && (event.button === 3 || event.button === 4)) {
        event.preventDefault();
      }
    };
    window.addEventListener('mouseup', onRelease, true);
    window.addEventListener('auxclick', onAuxClick, true);
    return () => {
      window.removeEventListener('mouseup', onRelease, true);
      window.removeEventListener('auxclick', onAuxClick, true);
    };
  }, [move]);

  return {
    move,
    canGoBack:
      position.step > 0 || levelPath(level).length > 1 || workspace === 'build',
    canGoForward: position.step < position.furthest,
  };
}

/**
 * Search engines read the canonical link to decide which address a page is.
 * `index.html` names the bare site, which would fold every place back into
 * the home page, so it follows the place too.
 */
function setCanonical(href: string) {
  const link = document.querySelector<HTMLLinkElement>('link[rel=canonical]');
  if (link && link.href !== href) link.href = href;
}
