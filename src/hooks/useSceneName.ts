import { useCallback, useEffect } from 'preact/hooks';
import useCustomSceneNames from '~/hooks/useCustomSceneNames';
import usePersistedState from '~/hooks/usePersistedState.ts';

function getSceneNameKey(name: string) {
  return `_s${name}_scene_name`;
}

export function getDefaultSceneName(name: string) {
  return `SCENE ${name}`;
}

export function getCustomSceneNames(
  projectId: string,
  sceneNames: string[],
): Record<string, string> {
  const projectPrefix = `p${projectId}`;
  const result: Record<string, string> = {};

  for (const sceneName of sceneNames) {
    const defaultName = getDefaultSceneName(sceneName);
    const key = projectPrefix + getSceneNameKey(sceneName);
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        const parsed = JSON.parse(storedValue);
        if (parsed) {
          result[sceneName] = parsed;
          continue;
        }
      }
    } catch {
      // ignore
    }

    result[sceneName] = defaultName;
  }

  return result;
}

function useSceneName(projectId: string, originalName: string = '') {
  const projectPrefix = `p${projectId}`;
  const key = projectPrefix + getSceneNameKey(originalName);
  const defaultName = getDefaultSceneName(originalName);
  const [sceneName, setSceneNameState] = usePersistedState<string>(key, defaultName);
  const { hasCustomNames, setHasCustomNames, syncCustomSceneNames } =
    useCustomSceneNames(projectId);

  useEffect(() => {
    if (originalName === '') {
      return;
    }

    if (!hasCustomNames) {
      setSceneNameState(defaultName);

      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Error removing localStorage key "${key}":`, error);
      }
    }
  }, [defaultName, hasCustomNames, key, originalName, setSceneNameState]);

  const setSceneName = useCallback(
    (value: string) => {
      const normalizedValue = value.trim() === '' ? defaultName : value.trim();
      setSceneNameState(normalizedValue);

      if (normalizedValue === defaultName) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Error removing localStorage key "${key}":`, error);
        }
      }

      syncCustomSceneNames();
    },
    [defaultName, key, setSceneNameState, syncCustomSceneNames],
  );

  const resetSceneNames = useCallback(() => {
    try {
      const keysToRemove = Object.keys(localStorage).filter((key) => key.startsWith(projectPrefix));

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });
      setHasCustomNames(false);
    } catch (error) {
      console.warn(`Error removing localStorage keys for "${projectPrefix}":`, error);
    }
  }, [projectPrefix, setHasCustomNames]);

  function getSceneName(name: string) {
    const defaultName = getDefaultSceneName(name);

    try {
      const key = projectPrefix + getSceneNameKey(name);
      const storedValue = localStorage.getItem(key);

      if (!storedValue) {
        return defaultName;
      }

      try {
        return JSON.parse(storedValue);
      } catch {
        return storedValue;
      }
    } catch (error) {
      console.warn(`Error getSceneName "${key}":`, error);
      return defaultName;
    }
  }

  return { sceneName, setSceneName, getSceneName, resetSceneNames };
}

export default useSceneName;
