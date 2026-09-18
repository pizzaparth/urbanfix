import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Screens used to refetch only when they regained focus, so a dashboard left
// open showed stale numbers indefinitely — and in the browser there was no way
// to refresh at all, because react-native-web renders RefreshControl as a plain
// View and drops onRefresh on the floor.
//
// This keeps the data live while the screen is actually being looked at, and
// stops the moment it isn't: polling pauses on blur and when the app goes to
// the background, so a phone in a pocket isn't hitting the API on cellular.
// That was the original reason the 10s web poll was dropped, and it still holds.
const DEFAULT_INTERVAL_MS = 15000;

export const useAutoRefresh = (fetcher, { intervalMs = DEFAULT_INTERVAL_MS } = {}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  // Held in a ref so an inline fetcher doesn't tear down and rebuild the
  // interval on every render.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const run = useCallback(async ({ showSpinner = false } = {}) => {
    if (showSpinner) setRefreshing(true);
    try {
      await fetcherRef.current();
      setLastUpdatedAt(Date.now());
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  // Manual pull/tap — shows the spinner. Background ticks stay silent so the
  // numbers just change under you rather than flashing a loading state.
  const refresh = useCallback(() => run({ showSpinner: true }), [run]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      run();
      const timer = setInterval(() => {
        if (!cancelled && AppState.currentState === 'active') run();
      }, intervalMs);

      // Catch up immediately on return from the background rather than waiting
      // out the rest of the interval.
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active' && !cancelled) run();
      });

      return () => {
        cancelled = true;
        clearInterval(timer);
        sub.remove();
      };
    }, [run, intervalMs])
  );

  return { refreshing, refresh, lastUpdatedAt };
};
