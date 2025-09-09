import { QueryClientProvider } from '@tanstack/react-query';
import { Provider, useAtom } from 'jotai';
import { projectIdAtom } from '../atoms/project';
import { APP_STATES, useAppState } from '../hooks/useAppState';
import useDevice from '../hooks/useDevice';
import queryClient from '../lib/queryClient';
import AppStateDisplay from './AppStateDisplay';
import DeviceProvider from './DeviceProvider';
import Donate from './Donate';
import ErrorBoundary from './ErrorBoundary';
import ErrorFallback from './ErrorFallback';
import ExportProject from './ExportProject';
import FacePlateHeader from './FacePlateHeader';
import IconGitHub from './icons/github.svg?react';
import IconMail from './icons/mail.svg?react';
import OfflineInformer from './OfflineInformer';
import Project from './Project';
import ProjectSelector from './ProjectSelector';
import UpdateInformer from './UpdateInformer';

function Main() {
  const [projectId] = useAtom(projectIdAtom);
  const { error } = useDevice();
  const appState = useAppState();

  return (
    <div className="min-w-[1100px] p-4 min-h-screen grid grid-rows-[auto_1fr]">
      <div className="mb-2 empty:mb-0">
        <UpdateInformer />
        <OfflineInformer />
      </div>

      <div className="grid grid-rows-[auto_1fr_auto] gap-2">
        <header className="flex flex-col gap-2">
          <div className="flex justify-between">
            <FacePlateHeader />

            <div className="flex gap-4  self-start items-end">
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
          </div>
          <div className="flex justify-between">
            <ProjectSelector />
            <ExportProject />
          </div>
        </header>

        <main className="bg-white h-full overflow-scroll border-1 border-black p-4">
          {appState.includes(APP_STATES.CAN_DISPLAY_PROJECT) && <Project projectId={projectId} />}

          {appState.includes(APP_STATES.LOADING) && (
            <AppStateDisplay
              title="Loading..."
              message="Please wait while the project is loading."
            />
          )}

          {appState.includes(APP_STATES.NO_PROJECT_SELECTED) && (
            <AppStateDisplay
              title="No Project Selected"
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
            <AppStateDisplay title="Error" message={error.message} />
          )}
        </main>
        <div className="bg-[#dbdddb] px-3 py-2 border-1 border-black text-xs text-black/70">
          This project is not affiliated with or officially authorized by Teenage Engineering
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Provider>
        <QueryClientProvider client={queryClient}>
          <DeviceProvider>
            <Main />
          </DeviceProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
