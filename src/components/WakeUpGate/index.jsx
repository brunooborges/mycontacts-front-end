import PropTypes from 'prop-types';

import { API_URL } from '../../config';
import useWakeUp from '../../hooks/useWakeUp';

import { Card, Fill, Overlay, Track } from './styles';

// Visitors who prefer reduced motion get a bar that moves in big steps, not a smooth crawl.
const REDUCED_MOTION_TICK_MS = 2000;

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Holds the app back until the API is awake. A free host puts the API to sleep when idle and needs
 * about a minute to start it again; without this the first request would fail. A warm server
 * answers at once and the visitor sees nothing. A sleeping one gets a progress screen that fills in
 * a minute, and the app opens the moment the server answers.
 */
export default function WakeUpGate({ children, healthUrl, fetchFn }) {
  const { phase, progress, retry } = useWakeUp({
    healthUrl,
    fetchFn,
    tickMs: prefersReducedMotion() ? REDUCED_MOTION_TICK_MS : undefined,
  });

  if (phase === 'ready') {
    return children;
  }

  if (phase === 'checking') {
    return null;
  }

  const percent = Math.round(progress);
  const isSlow = phase === 'slow';

  return (
    <Overlay>
      <Card role="status">
        <h2>Acordando o servidor</h2>

        <Track
          role="progressbar"
          aria-label="Acordando o servidor"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <Fill style={{ width: `${percent}%` }} />
        </Track>
        <strong>{percent}%</strong>

        {isSlow ? (
          <>
            <p>
              Está demorando mais que o normal. O servidor ainda pode estar acordando, e o app abre
              assim que ele responder.
            </p>
            <button
              type="button"
              onClick={retry}
            >
              Tentar novamente
            </button>
          </>
        ) : (
          <p>
            Esta demonstração roda em um servidor gratuito que dorme quando ninguém está usando.
            Acordá-lo leva até um minuto.
          </p>
        )}
      </Card>
    </Overlay>
  );
}

WakeUpGate.propTypes = {
  children: PropTypes.node.isRequired,
  healthUrl: PropTypes.string,
  fetchFn: PropTypes.func,
};

WakeUpGate.defaultProps = {
  healthUrl: `${API_URL}/health`,
  fetchFn: undefined,
};
