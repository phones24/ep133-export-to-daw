import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'jotai';
import { DndProvider } from 'react-dnd/dist/core/DndProvider';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Route, Switch } from 'wouter-preact';
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
                <DndProvider backend={HTML5Backend}>
                  <Home />
                </DndProvider>
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
