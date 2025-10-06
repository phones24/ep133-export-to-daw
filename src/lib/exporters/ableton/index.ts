import JSZip from 'jszip';
import {
  ExporterParams,
  ExportResult,
  ExportStatus,
  ProjectRawData,
  SampleReport,
} from '../../../types/types';
import { AbortError } from '../../utils';
import { collectSamples } from '../utils';
import { buildProject } from './builders';

async function exportAbleton(
  projectId: string,
  data: ProjectRawData,
  progressCallback: ({ progress, status }: ExportStatus) => void,
  exporterParams: ExporterParams,
  abortSignal: AbortSignal,
) {
  const files: Array<{
    name: string;
    url: string;
    type: 'project' | 'archive';
    size: number;
  }> = [];
  const projectName = `Project${projectId}`;
  const zippedProject = new JSZip();

  progressCallback({ progress: 1, status: 'Building project...' });

  if (abortSignal.aborted) {
    throw new AbortError();
  }

  const alsFile = await buildProject(data, exporterParams);

  zippedProject.file(`${projectName} Project/${projectName}.als`, alsFile);
  zippedProject.file(`${projectName} Project/Ableton Project Info/.dummy`, '');

  let sampleReport: SampleReport | undefined;

  if (exporterParams.includeArchivedSamples) {
    const { samples, sampleReport: report } = await collectSamples(
      data,
      progressCallback,
      abortSignal,
    );
    samples.forEach((s) => {
      zippedProject.file(`Project${projectId} Project/Samples/Imported/${s.name}`, s.data);
    });
    sampleReport = report;
  }

  progressCallback({ progress: 90, status: 'Bundle everything...' });

  const zippedProjectFile = await zippedProject.generateAsync({ type: 'blob' });

  files.push({
    name: `${projectName}.zip`,
    url: URL.createObjectURL(zippedProjectFile),
    type: 'archive',
    size: zippedProjectFile.size,
  });

  progressCallback({ progress: 100, status: 'Done' });

  return {
    files,
    sampleReport,
  } as ExportResult;
}

export default exportAbleton;
