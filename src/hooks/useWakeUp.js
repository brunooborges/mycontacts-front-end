import { useCallback, useEffect, useState } from 'react';

const SHOW_AFTER_MS = 1500;
const DURATION_MS = 60 * 1000;
const RETRY_EVERY_MS = 3000;
const REQUEST_TIMEOUT_MS = 20 * 1000;
const TICK_MS = 250;

// One stable function: a new one on every render would restart the effect below on every tick.
const defaultFetch = (...args) => fetch(...args);

/**
 * Wakes up a free-tier API before the app uses it. A free host puts the service to sleep when it is
 * idle and takes about a minute to start it again, so the first request would otherwise fail.
 *
 * It pings the health address until the server answers. Phases:
 * - checking: waiting for the first answer, quietly (a warm server answers well within this time);
 * - waking:   no answer after `showAfterMs`; the bar fills evenly over `durationMs`;
 * - slow:     the minute is over and there is still no answer; it keeps trying in the background;
 * - ready:    the server answered.
 */
export default function useWakeUp({
  healthUrl,
  fetchFn = defaultFetch,
  showAfterMs = SHOW_AFTER_MS,
  durationMs = DURATION_MS,
  retryEveryMs = RETRY_EVERY_MS,
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
  tickMs = TICK_MS,
}) {
  const [attempt, setAttempt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isShown, setIsShown] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    const timers = new Set();
    let isOver = false;
    let currentRequest = null;

    setElapsedMs(0);
    setIsShown(false);
    setIsSlow(false);
    setIsReady(false);

    function later(callback, ms) {
      const timer = setTimeout(() => {
        timers.delete(timer);
        callback();
      }, ms);
      timers.add(timer);
      return timer;
    }

    const ticker = setInterval(() => setElapsedMs(Date.now() - startedAt), tickMs);

    function finish() {
      isOver = true;
      clearInterval(ticker);
      timers.forEach(clearTimeout);
      timers.clear();
    }

    function ping() {
      const request = new AbortController();
      let isSettled = false;
      currentRequest = request;

      function settle(isAnswerOk) {
        if (isSettled || isOver) {
          return;
        }
        isSettled = true;
        clearTimeout(timeout); // eslint-disable-line no-use-before-define

        if (isAnswerOk) {
          finish();
          setIsReady(true);
          return;
        }

        later(ping, retryEveryMs);
      }

      // A request can hang for the whole wake-up, or forever: give up on it and ask again.
      const timeout = setTimeout(() => {
        timers.delete(timeout);
        request.abort();
        settle(false);
      }, requestTimeoutMs);
      timers.add(timeout);

      let answer;
      try {
        answer = Promise.resolve(fetchFn(healthUrl, { signal: request.signal, cache: 'no-store' }));
      } catch (error) {
        settle(false);
        return;
      }

      answer.then((response) => settle(Boolean(response.ok))).catch(() => settle(false));
    }

    later(() => setIsShown(true), showAfterMs);
    later(() => setIsSlow(true), durationMs);
    ping();

    return () => {
      finish();
      currentRequest?.abort();
    };
  }, [attempt, healthUrl, fetchFn, showAfterMs, durationMs, retryEveryMs, requestTimeoutMs, tickMs]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  let phase = 'checking';
  if (isReady) {
    phase = 'ready';
  } else if (isSlow) {
    phase = 'slow';
  } else if (isShown) {
    phase = 'waking';
  }

  const progress = isReady || isSlow ? 100 : Math.min(100, (elapsedMs / durationMs) * 100);

  return { phase, progress, retry };
}
