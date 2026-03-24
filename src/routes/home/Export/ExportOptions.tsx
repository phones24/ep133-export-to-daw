import { useFormContext, useWatch } from 'react-hook-form';
import CheckboxField from '~/components/form/CheckboxField';
import { ExportFormValues } from './exportFormSchema';

function ExportOptions({ disabled = false }: { disabled?: boolean }) {
  const { control } = useFormContext<ExportFormValues>();
  const format = useWatch({ control, name: 'format' });
  const includeArchivedSamples = useWatch({ control, name: 'includeArchivedSamples' });

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
    </div>
  );
}

export default ExportOptions;
