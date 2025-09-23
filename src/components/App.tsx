import { QueryClientProvider } from '@tanstack/react-query';
import { Provider, useAtom } from 'jotai';
import { Route, Switch } from 'wouter';
import { feedbackDialogAtom } from '../atoms/feedbackDialog';
import { projectIdAtom } from '../atoms/project';
import { APP_STATES, useAppState } from '../hooks/useAppState';
import useDevice from '../hooks/useDevice';
import queryClient from '../lib/queryClient';
import { store } from '../lib/store';
import AppStateDisplay from './AppStateDisplay';
import Arrangements from './Arrangements';
import DeviceProvider from './DeviceProvider';
import Donate from './Donate';
import ErrorBoundary from './ErrorBoundary';
import ErrorFallback from './ErrorFallback';
import FacePlateHeader from './FacePlateHeader';
import FeedbackDialog from './FeedbackDialog';
import IconGitHub from './icons/github.svg?react';
import IconMail from './icons/mail.svg?react';
import OfflineInformer from './OfflineInformer';
import Page404 from './Page404';
import ProjectManager from './ProjectManager';
import ProjectMeta from './ProjectMeta';
import Button from './ui/Button';
import Toast from './ui/Toast';

function Main() {
  const [projectId] = useAtom(projectIdAtom);
  const { error } = useDevice();
  const appState = useAppState();
  const [_, openFeedbackDialog] = useAtom(feedbackDialogAtom);

  return (
    <div className="min-w-[1100px] max-w-[1800px] p-4 min-h-screen grid grid-rows-[auto_1fr] mx-auto">
      <div className="mb-2 empty:mb-0">
        <OfflineInformer />
      </div>

      <div className="grid grid-rows-[auto_1fr_auto] gap-2">
        <header className="flex flex-col gap-2">
          <div className="flex justify-between">
            <FacePlateHeader />

            <div className="self-start flex flex-col gap-4">
              <div className="flex gap-4 items-end">
                <Donate />
                <a
                  href="https://github.com/phones24/ep133-export-to-daw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="View on GitHub"
                >
                  <IconGitHub className="text-gray-700" />
                </a>
                <a
                  href="mailto:ep133todaw@proton.me"
                  title="Mail me"
                  className="hover:opacity-80 transition-opacity"
                >
                  <IconMail className="text-gray-700" />
                </a>
              </div>

              <Button
                className="mr-auto w-full"
                variant="tertiary"
                size="sm"
                onClick={() => openFeedbackDialog(true)}
              >
                Feedback
              </Button>
            </div>
          </div>
          <div className="flex justify-between">
            <ProjectManager />
            <ProjectMeta projectId={projectId} />
          </div>
        </header>

        <main className="bg-white h-full overflow-scroll border-1 border-black p-4">
          {appState.includes(APP_STATES.CAN_DISPLAY_PROJECT) && (
            <Arrangements projectId={projectId} />
          )}

          {appState.includes(APP_STATES.LOADING) && (
            <AppStateDisplay
              title="Loading..."
              message="Please wait while the project is loading."
            />
          )}

          {appState.includes(APP_STATES.NO_PROJECT_SELECTED) && (
            <AppStateDisplay
              title="Ready to Export!"
              message="Please select a project from the dropdown."
            />
          )}

          {appState.includes(APP_STATES.NO_DEVICE_CONNECTED) && (
            <AppStateDisplay
              title="No Device Connected"
              message="Please connect a device and allow access to MIDI"
            />
          )}

          {appState.includes(APP_STATES.ERROR) && error && (
            <AppStateDisplay title="Error" message={error?.message || 'Unknown error'} />
          )}
        </main>
        <div className="bg-brand-gray px-3 py-2 border-1 border-black text-xs text-black/70">
          This project is not affiliated with or officially authorized by Teenage Engineering
        </div>
      </div>

      <FeedbackDialog />
      <Toast />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Switch>
            <Route path="/">
              <DeviceProvider>
                <Main />
              </DeviceProvider>
            </Route>
            <Route component={Page404} />
          </Switch>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
