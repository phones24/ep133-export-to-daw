import * as Sentry from '@sentry/react';
import { render } from 'preact';
import App from './components/App';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    sendDefaultPii: true,
  });
}

registerSW({ immediate: true }); // Force immediate service worker activation

render(<App />, document.getElementById('app') || document.body);
