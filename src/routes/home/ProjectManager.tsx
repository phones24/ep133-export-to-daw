import { useAtom } from 'jotai';
import { JSX } from 'preact';
import IconReload from '~/components/icons/reload.svg?react';
import IconResetSettings from '~/components/icons/reset-settings.svg?react';
import Button from '~/components/ui/Button';
import Select from '~/components/ui/Select';
import useCustomSceneNames from '~/hooks/useCustomSceneNames';
import useSceneName from '~/hooks/useSceneName.ts';
import { projectIdAtom } from '../../atoms/project';
import { APP_STATES, useAppState } from '../../hooks/useAppState';
import useProject from '../../hooks/useProject';
import useProjectsList from '../../hooks/useProjectsList';
import ExportProject from './ExportProject';

function ProjectManager() {
  const [projectId, setProjectId] = useAtom(projectIdAtom);
  const { refetch } = useProject(projectId);
  const { resetSceneNames } = useSceneName(projectId);
  const { hasCustomNames } = useCustomSceneNames(projectId);
  const appState = useAppState();
  const projects = useProjectsList();

  return (
    <div className="flex gap-2 items-center">
      <Select
        onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
          setProjectId((e.target as HTMLSelectElement).value)
        }
        value={projectId}
        name="project"
        size="sm"
        variant="secondary"
        disabled={!appState.includes(APP_STATES.CAN_SELECT_PROJECT)}
      >
        <option value="">Select project</option>
        {projects.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </Select>
      <Button
        onClick={() => refetch()}
        disabled={!appState.includes(APP_STATES.CAN_RELOAD_PROJECT)}
        size="sm"
        variant="secondary"
        title="Reload project data from device"
      >
        <IconReload className="w-4 h-4" />
      </Button>
      {hasCustomNames && (
        <Button
          onClick={resetSceneNames}
          disabled={!appState.includes(APP_STATES.CAN_DISPLAY_PROJECT)}
          size="sm"
          variant="secondary"
          title="Reset custom scene names"
        >
          <IconResetSettings className="w-4 h-4" />
        </Button>
      )}
      <ExportProject />
    </div>
  );
}

export default ProjectManager;
