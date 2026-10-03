/* eslint-env jest */
import { act, renderHook } from '@testing-library/react';

import useWakeUp from './useWakeUp';

const HEALTH_URL = 'https://api.example/health';

/** A fetch whose answers the test settles by hand. */
function controllableFetch() {
  const pending = [];
  const fetchFn = jest.fn(
    () =>
      new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      }),
  );

  return {
    fetchFn,
    answer: (index, ok = true) => pending[index].resolve({ ok }),
    fail: (index) => pending[index].reject(new Error('network down')),
  };
}

/** Moves the fake clock and lets the promises it unblocks settle. */
async function advance(ms) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

async function flush() {
  await act(async () => {});
}

describe('useWakeUp', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps counting when no fetch is passed in: the default must not restart the timers on every render', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() => new Promise(() => {}));
    try {
      const { result } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL }));

      await advance(30000);

      expect(result.current.progress).toBeCloseTo(50, 0);
      expect(global.fetch.mock.calls.length).toBeLessThanOrEqual(3);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('is ready at once, never showing the loader, when the server answers quickly', async () => {
    const { fetchFn, answer } = controllableFetch();
    const { result } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL, fetchFn }));
    expect(fetchFn).toHaveBeenCalledWith(HEALTH_URL, expect.anything());
    expect(result.current.phase).toBe('checking');

    await advance(300);
    answer(0);
    await flush();

    expect(result.current.phase).toBe('ready');
    await advance(5000);
    expect(result.current.phase).toBe('ready');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('keeps quiet for the first 1.5 seconds, then shows the loader', async () => {
    const { fetchFn } = controllableFetch();
    const { result } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL, fetchFn }));

    await advance(1499);
    expect(result.current.phase).toBe('checking');

    await advance(1);
    expect(result.current.phase).toBe('waking');
    expect(result.current.progress).toBeCloseTo(2.5, 0);
  });

  it('fills evenly to 100% over one minute', async () => {
    const { fetchFn } = controllableFetch();
    const { result } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL, fetchFn }));

    await advance(30000);
    expect(result.current.progress).toBeCloseTo(50, 0);

    await advance(15000);
    expect(result.current.progress).toBeCloseTo(75, 0);

    await advance(15000);
    expect(result.current.progress).toBe(100);
  });

  it('jumps to 100% and is ready the moment the server answers, however far along the bar was', async () => {
    const { fetchFn, answer } = controllableFetch();
    const { result } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL, fetchFn }));
    await advance(19000);
    expect(result.current.phase).toBe('waking');

    answer(0);
    await flush();

    expect(result.current.phase).toBe('ready');
    expect(result.current.progress).toBe(100);
  });

  it('treats a not-OK answer (a host still starting up) as not ready, and asks again', async () => {
    const { fetchFn, answer } = controllableFetch();
    const { result } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL, fetchFn, retryEveryMs: 3000 }));

    answer(0, false);
    await flush();
    expect(result.current.phase).toBe('checking');
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await advance(3000);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    answer(1, true);
    await flush();
    expect(result.current.phase).toBe('ready');
  });

  it('asks again after a network error too', async () => {
    const { fetchFn, fail, answer } = controllableFetch();
    const { result } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL, fetchFn, retryEveryMs: 3000 }));

    fail(0);
    await flush();
    await advance(3000);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    answer(1);
    await flush();
    expect(result.current.phase).toBe('ready');
  });

  it('abandons a request that hangs too long and asks again', async () => {
    const { fetchFn } = controllableFetch();
    renderHook(() =>
      useWakeUp({ healthUrl: HEALTH_URL, fetchFn, requestTimeoutMs: 10000, retryEveryMs: 3000 }),
    );
    const { signal } = fetchFn.mock.calls[0][1];

    await advance(10000);
    expect(signal.aborted).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await advance(3000);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('says it is taking longer than usual after a minute, and keeps trying in the background', async () => {
    const { fetchFn, answer } = controllableFetch();
    const { result } = renderHook(() =>
      useWakeUp({ healthUrl: HEALTH_URL, fetchFn, requestTimeoutMs: 10000, retryEveryMs: 3000 }),
    );

    await advance(60000);

    expect(result.current.phase).toBe('slow');
    expect(result.current.progress).toBe(100);
    const callsSoFar = fetchFn.mock.calls.length;
    expect(callsSoFar).toBeGreaterThan(3);

    // Pings start every 13 s (10 s timeout + 3 s pause): at 91 s one has just started and is live.
    await advance(31000);
    expect(fetchFn.mock.calls.length).toBeGreaterThan(callsSoFar);

    answer(fetchFn.mock.calls.length - 1);
    await flush();
    expect(result.current.phase).toBe('ready');
  });

  it('starts the minute again when the visitor retries', async () => {
    const { fetchFn } = controllableFetch();
    const { result } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL, fetchFn }));
    await advance(61000);
    expect(result.current.phase).toBe('slow');
    const calls = fetchFn.mock.calls.length;

    act(() => {
      result.current.retry();
    });
    await flush();

    expect(fetchFn.mock.calls.length).toBe(calls + 1);
    expect(result.current.phase).toBe('checking');
    await advance(1500);
    expect(result.current.phase).toBe('waking');
    expect(result.current.progress).toBeLessThan(5);
  });

  it('updates the bar at the pace it is given, so reduced motion can use big steps', async () => {
    const { fetchFn } = controllableFetch();
    const { result } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL, fetchFn, tickMs: 5000 }));

    await advance(5000);
    const first = result.current.progress;
    await advance(2000);

    expect(result.current.progress).toBe(first);
    await advance(3000);
    expect(result.current.progress).toBeGreaterThan(first);
  });

  it('stops everything when the page is left', async () => {
    const { fetchFn, fail } = controllableFetch();
    const { unmount } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL, fetchFn, retryEveryMs: 3000 }));
    fail(0);
    await flush();
    const calls = fetchFn.mock.calls.length;

    unmount();
    await advance(20000);

    expect(fetchFn.mock.calls.length).toBe(calls);
  });

  it('cancels the pending request when the page is left', async () => {
    const { fetchFn } = controllableFetch();
    const { unmount } = renderHook(() => useWakeUp({ healthUrl: HEALTH_URL, fetchFn }));
    const { signal } = fetchFn.mock.calls[0][1];

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
