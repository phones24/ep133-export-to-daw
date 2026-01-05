import { clsx } from 'clsx';
import { useAtomValue } from 'jotai';
import { projectIdAtom } from '../../atoms/project';
import CheckBox from '../../components/ui/CheckBox';
import useProject from '../../hooks/useProject';
import { Scene } from '../../types/types';

type ExportScenesProps = {
  allScenes: boolean;
  onAllScenesChange: (checked: boolean) => void;
  selectedScenes: string[];
  onSelectedScenesChange: (scenes: string[]) => void;
  disabled?: boolean;
};

function ExportScenes({
  allScenes,
  onAllScenesChange,
  selectedScenes,
  onSelectedScenesChange,
  disabled = false,
}: ExportScenesProps) {
  const projectId = useAtomValue(projectIdAtom);
  const { data } = useProject(projectId);

  const scenes: Scene[] = data?.scenes ?? [];

  const handleSceneToggle = (sceneName: string, checked: boolean) => {
    if (checked) {
      onSelectedScenesChange([...selectedScenes, sceneName]);
    } else {
      onSelectedScenesChange(selectedScenes.filter((s) => s !== sceneName));
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-40">
      <h4 className="font-semibold">Scenes</h4>
      <CheckBox
        checked={allScenes}
        onChange={onAllScenesChange}
        title="All scenes"
        disabled={disabled}
      />
      <div
        className={clsx('flex flex-col gap-2 w-50', {
          'max-h-35 overflow-y-auto': scenes.length > 5,
        })}
      >
        {scenes.map((scene) => (
          <CheckBox
            key={scene.name}
            checked={allScenes || selectedScenes.includes(scene.name)}
            onChange={(checked) => handleSceneToggle(scene.name, checked)}
            title={`Scene ${scene.name}`}
            disabled={disabled || allScenes}
            className="ml-4"
          />
        ))}
      </div>
    </div>
  );
}

export default ExportScenes;
