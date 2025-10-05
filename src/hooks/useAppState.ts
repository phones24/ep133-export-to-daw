import { useAtomValue } from 'jotai';
import { useMemo } from 'preact/hooks';
import { projectIdAtom } from '../atoms/project';
import useAllSounds from './useAllSounds';
import useDevice from './useDevice';
import useProject from './useProject';

export const APP_STATES = {
  CAN_DISPLAY_PROJECT: 'CAN_DISPLAY_PROJECT',
  NO_DEVICE_CONNECTED: 'NO_DEVICE_CONNECTED',
  ERROR: 'ERROR',
  LOADING: 'LOADING',
  NO_PROJECT_SELECTED: 'NO_PROJECT_SELECTED',
  CAN_SELECT_PROJECT: 'CAN_SELECT_PROJECT',
  CAN_RELOAD_PROJECT: 'CAN_RELOAD_PROJECT',
  DEVICE_READY: 'DEVICE_READY',
  CAN_EXPORT_PROJECT: 'CAN_EXPORT_PROJECT',
};

export function useAppState() {
  const projectId = useAtomValue(projectIdAtom);
  const { isLoading: isLoadingProject, isRefetching } = useProject(projectId);
  const { isLoading: isLoadingSounds } = useAllSounds();
  const { device, error } = useDevice();

  const isLoading = isLoadingProject || isLoadingSounds || isRefetching;
  const noDevice = !device;

  return useMemo(() => {
    const finalState = [];

    if (projectId && !isLoading && !noDevice) {
      finalState.push(APP_STATES.CAN_DISPLAY_PROJECT);
    }

    if (noDevice && !error) {
      finalState.push(APP_STATES.NO_DEVICE_CONNECTED);
    }

    if (error) {
      finalState.push(APP_STATES.ERROR);
    }

    if (isLoading) {
      finalState.push(APP_STATES.LOADING);
    }

    if (!projectId && !isLoading && !noDevice) {
      finalState.push(APP_STATES.NO_PROJECT_SELECTED);
    }

    if (!noDevice && !isLoading) {
      finalState.push(APP_STATES.CAN_SELECT_PROJECT);
    }

    if (projectId && !noDevice && !isLoading) {
      finalState.push(APP_STATES.CAN_RELOAD_PROJECT);
      finalState.push(APP_STATES.CAN_EXPORT_PROJECT);
    }

    return finalState;
  }, [isLoading, noDevice, projectId, error]);
}
