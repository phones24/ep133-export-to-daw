import { clsx } from 'clsx';
import { useAtomValue } from 'jotai';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { projectIdAtom } from '~/atoms/project';
import CheckBox from '~/components/ui/CheckBox';
import useProject from '~/hooks/useProject';
import useSceneName from '~/hooks/useSceneName.ts';
import { Scene } from '~/types/types';
import { ExportFormValues } from './exportFormSchema';

function ExportScenes({ disabled = false }: { disabled?: boolean }) {
  const projectId = useAtomValue(projectIdAtom);
  const { data } = useProject(projectId);
  const { getSceneName } = useSceneName(projectId);
  const { control, setValue } = useFormContext<ExportFormValues>();

  const scenes: Scene[] = data?.scenes ?? [];
  const allScenes = useWatch({ control, name: 'allScenes' });
  const selectedScenes = useWatch({ control, name: 'selectedScenes' });

  const handleSceneToggle = (sceneName: string, checked: boolean) => {
    const current = selectedScenes ?? [];
    if (checked) {
      setValue('selectedScenes', [...current, sceneName]);
    } else {
      setValue(
        'selectedScenes',
        current.filter((s) => s !== sceneName),
      );
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-40">
      <h4 className="font-semibold">Scenes</h4>
      <Controller
        name="allScenes"
        control={control}
        render={({ field }) => (
          <CheckBox
            checked={field.value}
            onChange={(checked) => field.onChange(checked)}
            title="All scenes"
            disabled={disabled}
          />
        )}
      />
      <div
        className={clsx('flex flex-col gap-2 w-50', {
          'max-h-35 overflow-y-auto': scenes.length > 5,
        })}
      >
        {scenes.map((scene) => (
          <CheckBox
            key={scene.name}
            checked={allScenes || (selectedScenes ?? []).includes(scene.name)}
            onChange={(checked) => handleSceneToggle(scene.name, checked)}
            title={getSceneName(scene.name)}
            disabled={disabled || allScenes}
            className="ml-4"
          />
        ))}
      </div>
    </div>
  );
}

export default ExportScenes;
