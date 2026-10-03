/* eslint-env jest */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import defaultTheme from '../../assets/styles/Themes/default';
import WakeUpGate from '.';

function controllableFetch() {
  const pending = [];
  const fetchFn = jest.fn(
    () =>
      new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      }),
  );

  return { fetchFn, answer: (index, ok = true) => pending[index].resolve({ ok }) };
}

function renderGate(fetchFn) {
  return render(
    <ThemeProvider theme={defaultTheme}>
      <WakeUpGate
        healthUrl="https://api.example/health"
        fetchFn={fetchFn}
      >
        <p>o app</p>
      </WakeUpGate>
    </ThemeProvider>,
  );
}

async function advance(ms) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('WakeUpGate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete window.matchMedia;
  });

  it('shows the app, and no loader, as soon as a warm server answers', async () => {
    const { fetchFn, answer } = controllableFetch();
    renderGate(fetchFn);
    expect(screen.queryByText('o app')).not.toBeInTheDocument();

    await advance(200);
    await act(async () => answer(0));

    expect(screen.getByText('o app')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('holds the app back while the server is still asleep, so its first request does not fail', async () => {
    const { fetchFn } = controllableFetch();
    renderGate(fetchFn);

    await advance(10000);

    expect(screen.queryByText('o app')).not.toBeInTheDocument();
  });

  it('shows nothing during the first 1.5 seconds, then the progress screen', async () => {
    const { fetchFn } = controllableFetch();
    renderGate(fetchFn);

    await advance(1000);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    await advance(500);
    const bar = screen.getByRole('progressbar', { name: /acordando o servidor/i });
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByText(/servidor gratuito/i)).toBeInTheDocument();
  });

  it('fills the bar evenly over a minute and says how far along it is', async () => {
    const { fetchFn } = controllableFetch();
    renderGate(fetchFn);

    await advance(30000);

    const bar = screen.getByRole('progressbar');
    expect(Number(bar.getAttribute('aria-valuenow'))).toBe(50);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('swaps the loader for the app the moment the server answers', async () => {
    const { fetchFn, answer } = controllableFetch();
    renderGate(fetchFn);
    await advance(19000);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await act(async () => answer(0));

    expect(screen.getByText('o app')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('admits it is taking longer than usual after a minute, and offers to try again', async () => {
    const { fetchFn } = controllableFetch();
    renderGate(fetchFn);

    await advance(61000);

    expect(screen.getByText(/demorando mais que o normal/i)).toBeInTheDocument();
    const calls = fetchFn.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    await advance(0);

    expect(fetchFn.mock.calls.length).toBe(calls + 1);
    expect(screen.queryByText(/demorando mais que o normal/i)).not.toBeInTheDocument();
  });

  it('announces the state politely to screen readers', async () => {
    const { fetchFn } = controllableFetch();
    renderGate(fetchFn);

    await advance(2000);

    expect(screen.getByRole('status')).toHaveTextContent(/acordando o servidor/i);
  });

  it('moves the bar in big steps instead of smoothly when the visitor prefers reduced motion', async () => {
    window.matchMedia = (query) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    const { fetchFn } = controllableFetch();
    renderGate(fetchFn);

    await advance(1600);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

    await advance(2000);
    expect(Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  });
});
