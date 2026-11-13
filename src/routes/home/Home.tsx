import { useAtom } from 'jotai';

import { projectIdAtom } from '~/atoms/project';
import OfflineInformer from '~/components/OfflineInformer';
import UpdateNotifier from '~/components/UpdateNotifier';
import Toast from '~/components/ui/Toast';
import { APP_STATES, useAppState } from '~/hooks/useAppState';
import useDevice from '~/hooks/useDevice';
import useDroppedFile from '~/hooks/useDroppedFile';
import { usePageMeta } from '~/hooks/usePageMeta';
import AppStateDisplay from './AppStateDisplay';
import EPToolkitDialog from './EPToolkitDialog';
import FacePlateHeader from './FacePlateHeader';
import FeedbackDialog from './FeedbackDialog';
import Menu from './Menu';
import ProjectMeta from './ProjectMeta';
import Arrangements from './ProjectView/Arrangements';
import RiddimDialog from './RiddimDialog';

function Home() {
  usePageMeta({
    title: 'EP-133: Export to DAW (Ableton, REAPER, MIDI) | Free Tool',
    description:
      'Export Teenage Engineering EP-133, EP-1320 or EP-40 projects to Ableton Live, DAWproject, REAPER or MIDI in your browser. No install; works with WebMIDI.',
    path: '/',
  });
  const [projectId] = useAtom(projectIdAtom);
  const { error } = useDevice();
  const appState = useAppState();
  const { dropRef } = useDroppedFile();

  return (
    <div className="min-w-0 max-w-450 p-4 h-dvh grid grid-rows-[auto_minmax(0,1fr)] mx-auto max-[1100px]:h-auto max-[1100px]:min-h-dvh">
      <div className="mb-2 empty:mb-0">
        <UpdateNotifier />
        <OfflineInformer />
      </div>

      <div className="grid grid-rows-[auto_minmax(0,1fr)_auto] gap-2 max-h-full min-h-0 min-w-0 max-[1100px]:max-h-none max-[1100px]:grid-rows-[auto_minmax(18rem,1fr)_auto]">
        <header className="flex flex-col gap-2">
          <div className="flex justify-between gap-4 min-w-0 max-[1100px]:flex-col">
            <FacePlateHeader />

            <div className="self-start flex flex-col gap-2 max-[1100px]:self-stretch max-[1100px]:grid max-[1100px]:grid-cols-2 max-[1100px]:items-start max-sm:grid-cols-1">
              <Menu />
              <a
                href="https://eptoolkit.ep133-to-daw.cc/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-creme bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:40px_40px] border border-black shadow-[1px_1px_0px_1px_#00000099] flex items-center gap-2 h-15 px-3"
              >
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-2xl font-bold leading-tight text-brand">EP Toolkit</span>
                  <span className="text-xs text-black/60 leading-tight">
                    Standalone app: export, samples, backups
                  </span>
                </div>
                <img
                  src="/eptoolkit/eptoolkit-logo.png"
                  alt="EP Toolkit"
                  className="size-10 shrink-0 ml-auto"
                />
              </a>
            </div>
          </div>
          <ProjectMeta projectId={projectId} />
        </header>

        <main
          ref={dropRef as any}
          className="bg-white h-full min-h-0 min-w-0 border p-4 shadow-[1px_1px_0px_1px_#00000099] overflow-auto max-[1100px]:max-h-[70dvh]"
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
              message={
                <>
                  Please connect a device and allow access to MIDI
                  <br />
                  or drop a .pak/.ppak backup file
                </>
              }
            />
          )}

          {appState.includes(APP_STATES.ERROR) && error && (
            <AppStateDisplay title="Error" message={error?.message || 'Unknown error'} />
          )}
        </main>
        <div className="bg-face px-3 py-2 border border-black text-xs text-black/70 shadow-[1px_1px_0px_1px_#00000099] flex flex-wrap gap-2 items-center justify-between">
          <span>
            This project is not affiliated with or officially authorized by Teenage Engineering
          </span>
          <a
            href="https://randomware-audio.cc/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-2 text-black text-sm"
          >
            <img src="/ra-logo.svg" alt="" className="size-5" />
            Randomware Audio
          </a>
        </div>
      </div>

      <FeedbackDialog />
      <EPToolkitDialog />
      <RiddimDialog />
      <Toast />
    </div>
  );
}

export default Home;
