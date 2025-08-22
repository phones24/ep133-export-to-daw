import { useAtomValue } from 'jotai';
import { useState } from 'preact/hooks';
import { projectIdAtom } from '../atoms/project';
import { exportDawProject } from '../lib/exporter';
import useAllSounds, { Sound } from './useAllSounds';
import useProject, { ProjectRawData } from './useProject';

export type ExportFormatId = 'dawproject' | 'midi';
export type ExportFormat = {
  name: string;
  value: ExportFormatId;
  exportFn: (data: ProjectRawData, sounds: Sound[]) => Promise<void>;
};

export const exportFormats: ExportFormat[] = [
  {
    name: 'DAWproject',
    value: 'dawproject',
    exportFn: exportDawProject,
  },
];

function useExportProject(format: ExportFormatId) {
  const projectId = useAtomValue(projectIdAtom);
  const { data: projectRawData } = useProject(projectId);
  const { data: allSounds } = useAllSounds();
  const [isPending, setIsPending] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('Exporting...');
  const [percentage, setPercentage] = useState(0);

  const startExport = async () => {
    const formatData = exportFormats.find((f) => f.value === format);

    if (!formatData || !projectRawData || !allSounds) {
      return;
    }

    setIsPending(true);
    setPercentage(1);
    setPendingStatus('Collecting data...');

    await formatData.exportFn(projectRawData, allSounds);

    setIsPending(false);
    setPercentage(100);
    setPendingStatus('Completed');
    // console.log(data);
  };

  return { startExport, isPending, pendingStatus, percentage };
}

export default useExportProject;
