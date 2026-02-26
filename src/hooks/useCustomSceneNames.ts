import { useAtom } from 'jotai';
import { useCallback } from 'preact/hooks';
import { customSceneNamesByProjectAtom } from '~/atoms/project';

function checkHasCustomSceneNames(projectPrefix: string): boolean {
  if (projectPrefix === 'p') {
    return false;
  }

  try {
    return Object.keys(localStorage).some((key) => key.startsWith(projectPrefix));
  } catch (error) {
    console.warn(`Error checking custom scene names:`, error);
    return false;
  }
}

function useCustomSceneNames(projectId: string) {
  const [customSceneNamesByProject, setCustomSceneNamesByProject] = useAtom(
    customSceneNamesByProjectAtom,
  );
  const projectPrefix = `p${projectId}`;
  const hasCustomNames =
    customSceneNamesByProject[projectId] ?? checkHasCustomSceneNames(projectPrefix);

  const syncCustomSceneNames = useCallback(() => {
    setCustomSceneNamesByProject((prev) => ({
      ...prev,
      [projectId]: checkHasCustomSceneNames(projectPrefix),
    }));
  }, [projectId, projectPrefix, setCustomSceneNamesByProject]);

  const setHasCustomNames = useCallback(
    (value: boolean) => {
      setCustomSceneNamesByProject((prev) => ({
        ...prev,
        [projectId]: value,
      }));
    },
    [projectId, setCustomSceneNamesByProject],
  );

  return { hasCustomNames, setHasCustomNames, syncCustomSceneNames };
}

export default useCustomSceneNames;
