import { useAtom } from 'jotai';
import { JSX } from 'preact';
import IconReload from '~/components/icons/reload.svg?react';
import Button from '~/components/ui/Button';
import Select from '~/components/ui/Select';
import { projectIdAtom } from '../../atoms/project';
import { APP_STATES, useAppState } from '../../hooks/useAppState';
import useProject from '../../hooks/useProject';
import ExportProject from './ExportProject';

const PROJECTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function ProjectManager() {
  const [projectId, setProjectId] = useAtom(projectIdAtom);
  const { refetch } = useProject(projectId);
  const appState = useAppState();

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
        {PROJECTS.map((p) => (
          <option key={p} value={p}>
            Project {p}
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
      <ExportProject />
    </div>
  );
}

export default ProjectManager;
