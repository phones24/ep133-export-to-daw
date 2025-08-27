import * as Sentry from '@sentry/react';
import { render } from 'preact';
import App from './components/App';
import './styles.css';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    sendDefaultPii: true,
  });
}

render(<App />, document.getElementById('app') || document.body);
