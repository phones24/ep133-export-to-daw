import * as Sentry from '@sentry/react';
import { render } from 'preact';
import { swUpdateAvailableAtom } from './atoms/swUpdate';
import { store } from './lib/store';
import App from './App';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    sendDefaultPii: true,
  });
}

registerSW({
  immediate: true,
  onNeedRefresh() {
    store.set(swUpdateAvailableAtom, true);
  },
});

render(<App />, document.getElementById('app') || document.body);
