import { z } from 'zod';
import { ExportFormatId } from '../../../types/types';

const FORMAT_IDS: [ExportFormatId, ...ExportFormatId[]] = [
  'ableton',
  'dawproject',
  'midi',
  'reaper',
];

export const exportFormSchema = z.object({
  format: z.enum(FORMAT_IDS),
  projectName: z.string(),
  includeArchivedSamples: z.boolean(),
  exportAllSamples: z.boolean(),
  clips: z.boolean(),
  groupTracks: z.boolean(),
  drumRackGroupA: z.boolean(),
  drumRackGroupB: z.boolean(),
  drumRackGroupC: z.boolean(),
  drumRackGroupD: z.boolean(),
  sendEffects: z.boolean(),
  allScenes: z.boolean(),
  selectedScenes: z.array(z.string()),
});

export type ExportFormValues = z.infer<typeof exportFormSchema>;

export const PERSISTED_FIELDS: (keyof ExportFormValues)[] = [
  'format',
  'includeArchivedSamples',
  'exportAllSamples',
  'clips',
  'groupTracks',
  'drumRackGroupA',
  'drumRackGroupB',
  'drumRackGroupC',
  'drumRackGroupD',
  'sendEffects',
];
