import { useAtomValue } from 'jotai';
import { useMemo } from 'preact/hooks';
import { useFormContext, useWatch } from 'react-hook-form';
import { projectIdAtom } from '~/atoms/project';
import CheckboxField from '~/components/form/CheckboxField';
import useProject from '~/hooks/useProject';
import { hasMultipleNoteVariations } from '~/lib/utils';
import { ExportFormValues } from './exportFormSchema';

function ExportOptions({ disabled = false }: { disabled?: boolean }) {
  const { control } = useFormContext<ExportFormValues>();
  const format = useWatch({ control, name: 'format' });
  const includeArchivedSamples = useWatch({ control, name: 'includeArchivedSamples' });
  const drumRackGroupA = useWatch({ control, name: 'drumRackGroupA' });
  const drumRackGroupB = useWatch({ control, name: 'drumRackGroupB' });
  const drumRackGroupC = useWatch({ control, name: 'drumRackGroupC' });
  const drumRackGroupD = useWatch({ control, name: 'drumRackGroupD' });

  const projectId = useAtomValue(projectIdAtom);
  const { data: projectData } = useProject(projectId);

  const notesVariationWarnings = useMemo(() => {
    if (format === 'reaper') {
      return [];
    }

    const result: string[] = [];
    const scenes = projectData?.scenes ?? [];

    if (drumRackGroupA && hasMultipleNoteVariations('a', scenes)) {
      result.push('Group A');
    }
    if (drumRackGroupB && hasMultipleNoteVariations('b', scenes)) {
      result.push('Group B');
    }
    if (drumRackGroupC && hasMultipleNoteVariations('c', scenes)) {
      result.push('Group C');
    }
    if (drumRackGroupD && hasMultipleNoteVariations('d', scenes)) {
      result.push('Group D');
    }

    return result;
  }, [format, drumRackGroupA, drumRackGroupB, drumRackGroupC, drumRackGroupD, projectData]);

  return (
    <div className="flex flex-col gap-2 min-w-1/2">
      <h4 className="font-semibold">Options</h4>
      {format === 'dawproject' && (
        <>
          <CheckboxField
            name="includeArchivedSamples"
            title="Include archived WAV samples"
            disabled={disabled}
          />
          <CheckboxField
            name="exportAllPadsWithSamples"
            title="Export all pads with assigned samples"
            disabled={disabled || !includeArchivedSamples}
            helperText="Export all pads with assigned samples even if they are not used in patterns"
          />
          <CheckboxField name="clips" title="Export with clips" disabled={disabled} />
          <CheckboxField
            name="drumRackGroupA"
            title="Merge tracks of group A into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckboxField
            name="drumRackGroupB"
            title="Merge tracks of group B into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckboxField
            name="drumRackGroupC"
            title="Merge tracks of group C into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckboxField
            name="drumRackGroupD"
            title="Merge tracks of group D into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
        </>
      )}

      {format === 'ableton' && (
        <>
          <CheckboxField
            name="includeArchivedSamples"
            title="Include samples"
            disabled={disabled}
            helperText="Samples will be exported as separate WAV files and bundled with the project. Sampler instrument will be assigned to each track that has a sample."
          />
          <CheckboxField
            name="drumRackGroupA"
            title="Use «Drum Rack» for group A"
            disabled={disabled || !includeArchivedSamples}
            className="ml-4"
            helperText="Tracks in group A will be exported as Drum Rack. Choke groups are supported! Make sure your drum pads are not playing chromatically."
          />
          <CheckboxField
            name="drumRackGroupB"
            title="Use «Drum Rack» for group B"
            disabled={disabled || !includeArchivedSamples}
            className="ml-4"
            helperText="Tracks in group B will be exported as Drum Rack. Choke groups are supported! Make sure your drum pads are not playing chromatically."
          />
          <CheckboxField
            name="drumRackGroupC"
            title="Use «Drum Rack» for group C"
            disabled={disabled || !includeArchivedSamples}
            className="ml-4"
            helperText="Tracks in group C will be exported as Drum Rack. Choke groups are supported! Make sure your drum pads are not playing chromatically."
          />
          <CheckboxField
            name="drumRackGroupD"
            title="Use «Drum Rack» for group D"
            disabled={disabled || !includeArchivedSamples}
            className="ml-4"
            helperText="Tracks in group D will be exported as Drum Rack. Choke groups are supported! Make sure your drum pads are not playing chromatically."
          />
          <CheckboxField
            name="exportAllPadsWithSamples"
            title="Export all pads with assigned samples"
            disabled={disabled || !includeArchivedSamples}
            helperText="Export all samples and create tracks for all pads with assigned samples, even if they are not used in patterns"
          />
          <CheckboxField
            name="clips"
            title="Session clips instead of arrangements"
            disabled={disabled}
            helperText="Export as session clips for live performance."
          />
          <CheckboxField
            name="groupTracks"
            title="Group tracks"
            disabled={disabled}
            helperText="Tracks will be grouped by their groups (A, B, C, D) same as on the device."
          />
          <CheckboxField
            name="sendEffects"
            title="Send effects"
            disabled={disabled}
            helperText="Return track with effect will be added. Each individual track will be sending to the return track. If you select «Group tracks», each group will send its audio to the return track."
          />
        </>
      )}

      {format === 'reaper' && (
        <>
          <CheckboxField
            name="includeArchivedSamples"
            title="Include samples"
            disabled={disabled}
            helperText="Samples will be exported as WAV files and bundled with the project in Media/samples folder."
          />
          <CheckboxField
            name="exportAllPadsWithSamples"
            title="Export all pads with assigned samples"
            disabled={disabled || !includeArchivedSamples}
            helperText="Export all pads with assigned samples even if they are not used in patterns"
          />
          <CheckboxField
            name="groupTracks"
            title="Group tracks"
            disabled={disabled}
            helperText="Tracks will be grouped by their groups (A, B, C, D) same as on the device."
          />
        </>
      )}

      {format === 'midi' && (
        <>
          <CheckboxField
            name="includeArchivedSamples"
            title="Include archived WAV samples"
            disabled={disabled}
          />
          <CheckboxField
            name="exportAllPadsWithSamples"
            title="Export all pads with assigned samples"
            disabled={disabled || !includeArchivedSamples}
            helperText="Export all pads with assigned samples even if they are not used in patterns"
          />
          <CheckboxField
            name="drumRackGroupA"
            title="Merge tracks of group A into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckboxField
            name="drumRackGroupB"
            title="Merge tracks of group B into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckboxField
            name="drumRackGroupC"
            title="Merge tracks of group C into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckboxField
            name="drumRackGroupD"
            title="Merge tracks of group D into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
        </>
      )}

      {format === 'xm' && (
        <CheckboxField
          name="exportAllPadsWithSamples"
          title="Include all pads with assigned samples"
          disabled={disabled}
          helperText="XM samples are embedded in the module. This also adds unused pads as editable instruments."
        />
      )}

      {notesVariationWarnings.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-sm mt-4">
          <strong>Warning:</strong> The following groups contain tracks with multiple note
          variations. Merging them into a single track or Drum Rack will flatten all notes to a
          single pitch: {notesVariationWarnings.join(', ')}
        </div>
      )}
    </div>
  );
}

export default ExportOptions;
