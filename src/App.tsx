import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'jotai';
import { DndProvider } from 'react-dnd/dist/core/DndProvider';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Route, Switch } from 'wouter-preact';
import Faq from '~/routes/faq/Faq';
import Home from '~/routes/home/Home';
import DeviceProvider from './components/DeviceProvider';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorFallback from './components/ErrorFallback';
import Layout from './components/Layout';
import Page404 from './components/Page404';
import queryClient from './lib/queryClient';
import { store } from './lib/store';

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Layout>
            <DeviceProvider>
              <Switch>
                <Route path="/">
                  <DndProvider backend={HTML5Backend}>
                    <Home />
                  </DndProvider>
                </Route>
                <Route path="/faq">
                  <Faq />
                </Route>
                <Route component={Page404} />
              </Switch>
            </DeviceProvider>
          </Layout>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
