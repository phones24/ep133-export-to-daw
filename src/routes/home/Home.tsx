import { useAtom } from 'jotai';

import { projectIdAtom } from '~/atoms/project';
import OfflineInformer from '~/components/OfflineInformer';
import Toast from '~/components/ui/Toast';
import { APP_STATES, useAppState } from '~/hooks/useAppState';
import useDevice from '~/hooks/useDevice';
import useDroppedProjectFile from '~/hooks/useDroppedProjectFile';
import AppStateDisplay from './AppStateDisplay';
import FacePlateHeader from './FacePlateHeader';
import FeedbackDialog from './FeedbackDialog';
import Menu from './Menu';
import ProjectMeta from './ProjectMeta';
import Arrangements from './ProjectView/Arrangements';

function Home() {
  const [projectId] = useAtom(projectIdAtom);
  const { error } = useDevice();
  const appState = useAppState();
  const { dropRef } = useDroppedProjectFile();

  return (
    <div className="min-w-[1100px] max-w-[1800px] p-4 h-screen grid grid-rows-[auto_1fr] mx-auto">
      <div className="mb-2 empty:mb-0">
        <OfflineInformer />
      </div>

      <div className="grid grid-rows-[auto_1fr_auto] gap-2 max-h-full min-h-0">
        <header className="flex flex-col gap-2">
          <div className="flex justify-between">
            <FacePlateHeader />

            <div className="self-start flex flex-col gap-4">
              <Menu />
            </div>
          </div>
          <ProjectMeta projectId={projectId} />
        </header>

        <main
          ref={dropRef as any}
          className="bg-white h-full border-1 p-4 shadow-[1px_1px_0px_1px_#00000099] overflow-scroll"
        >
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
              message="Select a project from the dropdown."
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
        <div className="bg-brand-gray px-3 py-2 border-1 border-black text-xs text-black/70 shadow-[1px_1px_0px_1px_#00000099]">
          This project is not affiliated with or officially authorized by Teenage Engineering
        </div>
      </div>

      <FeedbackDialog />
      <Toast />
    </div>
  );
}

export default Home;
