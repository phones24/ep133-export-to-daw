import usePersistedState from '~/hooks/usePersistedState.ts';

function useSceneName(projectId: string, originalName: string = '') {
  const projectPrefix = 'p' + projectId;
  const key = projectPrefix + '_s' + originalName + '_scene_name';
  const defaultName = `SCENE ${originalName}`;
  const [sceneName, setSceneName] = usePersistedState<string>(key, defaultName);

  const resetSceneNames = () => {
    try {
      const keysToRemove = Object.keys(localStorage).filter((key) => key.startsWith(projectPrefix));

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  };

  return { sceneName, setSceneName, resetSceneNames };
}

export default useSceneName;
