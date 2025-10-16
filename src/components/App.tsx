import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'jotai';
import { Route, Switch } from 'wouter';
import Faq from '~/routes/faq/Faq';
import Home from '~/routes/home/Home';
import queryClient from '../lib/queryClient';
import { store } from '../lib/store';
import DeviceProvider from './DeviceProvider';
import ErrorBoundary from './ErrorBoundary';
import ErrorFallback from './ErrorFallback';
import Page404 from './Page404';

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Switch>
            <Route path="/">
              <DeviceProvider>
                <Home />
              </DeviceProvider>
            </Route>
            <Route path="/faq">
              <Faq />
            </Route>
            <Route component={Page404} />
          </Switch>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
