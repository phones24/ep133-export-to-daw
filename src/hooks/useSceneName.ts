import usePersistedState from '~/hooks/usePersistedState.ts';

function getSceneNameKey(name: string) {
  return '_s' + name + '_scene_name';
}

function getDefaultSceneName(name: string) {
  return `SCENE ${name}`;
}

function useSceneName(projectId: string, originalName: string = '') {
  const projectPrefix = 'p' + projectId;
  const key = projectPrefix + getSceneNameKey(originalName);
  const defaultName = getDefaultSceneName(originalName);
  const [sceneName, setSceneName] = usePersistedState<string>(key, defaultName);

  function resetSceneNames() {
    try {
      const keysToRemove = Object.keys(localStorage).filter((key) => key.startsWith(projectPrefix));

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }

  function getSceneName(name: string) {
    const defaultName = getDefaultSceneName(originalName);

    try {
      const key = projectPrefix + getSceneNameKey(name);
      console.log(key);
      return localStorage.getItem(key) ?? defaultName;
    } catch (error) {
      console.warn(`Error getSceneName "${key}":`, error);
      return defaultName;
    }
  }

  return { sceneName, setSceneName, getSceneName, resetSceneNames };
}

export default useSceneName;
