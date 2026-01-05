import CheckBox from '../../components/ui/CheckBox';
import { ExportFormatId } from '../../types/types';

type ExportOptionsProps = {
  format: ExportFormatId;
  includeArchivedSamples: boolean;
  onIncludeArchivedSamplesChange: (checked: boolean) => void;
  clips: boolean;
  onClipsChange: (checked: boolean) => void;
  groupTracks: boolean;
  onGroupTracksChange: (checked: boolean) => void;
  drumRackGroupA: boolean;
  onDrumRackGroupAChange: (checked: boolean) => void;
  drumRackGroupB: boolean;
  onDrumRackGroupBChange: (checked: boolean) => void;
  drumRackGroupC: boolean;
  onDrumRackGroupCChange: (checked: boolean) => void;
  drumRackGroupD: boolean;
  onDrumRackGroupDChange: (checked: boolean) => void;
  sendEffects: boolean;
  onSendEffectsChange: (checked: boolean) => void;
  disabled?: boolean;
};

function ExportOptions({
  format,
  includeArchivedSamples,
  onIncludeArchivedSamplesChange,
  clips,
  onClipsChange,
  groupTracks,
  onGroupTracksChange,
  drumRackGroupA,
  onDrumRackGroupAChange,
  drumRackGroupB,
  onDrumRackGroupBChange,
  drumRackGroupC,
  onDrumRackGroupCChange,
  drumRackGroupD,
  onDrumRackGroupDChange,
  sendEffects,
  onSendEffectsChange,
  disabled = false,
}: ExportOptionsProps) {
  return (
    <div className="flex flex-col gap-2 min-w-1/2">
      <h4 className="font-semibold">Options</h4>
      {format === 'dawproject' && (
        <>
          <CheckBox
            checked={includeArchivedSamples}
            onChange={onIncludeArchivedSamplesChange}
            title="Include archived WAV samples"
            disabled={disabled}
          />
          <CheckBox
            checked={clips}
            onChange={onClipsChange}
            title="Export with clips"
            disabled={disabled}
          />
          <CheckBox
            checked={drumRackGroupA}
            onChange={onDrumRackGroupAChange}
            title="Merge tracks of group A into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckBox
            checked={drumRackGroupB}
            onChange={onDrumRackGroupBChange}
            title="Merge tracks of group B into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckBox
            checked={drumRackGroupC}
            onChange={onDrumRackGroupCChange}
            title="Merge tracks of group C into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckBox
            checked={drumRackGroupD}
            onChange={onDrumRackGroupDChange}
            title="Merge tracks of group D into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
        </>
      )}

      {format === 'ableton' && (
        <>
          <CheckBox
            checked={includeArchivedSamples}
            onChange={onIncludeArchivedSamplesChange}
            title="Include samples"
            disabled={disabled}
            helperText="Samples will be exported as separate WAV files and bundled with the project. Sampler instrument will be assigned to each track that has a sample."
          />
          <CheckBox
            checked={drumRackGroupA}
            onChange={onDrumRackGroupAChange}
            title="Use «Drum Rack» for group A"
            disabled={disabled || !includeArchivedSamples}
            className="ml-4"
            helperText="Tracks in group A will be exported as Drum Rack. Choke groups are supported! Make sure your drum pads are not playing chromatically."
          />
          <CheckBox
            checked={drumRackGroupB}
            onChange={onDrumRackGroupBChange}
            title="Use «Drum Rack» for group B"
            disabled={disabled || !includeArchivedSamples}
            className="ml-4"
            helperText="Tracks in group B will be exported as Drum Rack. Choke groups are supported! Make sure your drum pads are not playing chromatically."
          />
          <CheckBox
            checked={drumRackGroupC}
            onChange={onDrumRackGroupCChange}
            title="Use «Drum Rack» for group C"
            disabled={disabled || !includeArchivedSamples}
            className="ml-4"
            helperText="Tracks in group C will be exported as Drum Rack. Choke groups are supported! Make sure your drum pads are not playing chromatically."
          />
          <CheckBox
            checked={drumRackGroupD}
            onChange={onDrumRackGroupDChange}
            title="Use «Drum Rack» for group D"
            disabled={disabled || !includeArchivedSamples}
            className="ml-4"
            helperText="Tracks in group D will be exported as Drum Rack. Choke groups are supported! Make sure your drum pads are not playing chromatically."
          />
          <CheckBox
            checked={clips}
            onChange={onClipsChange}
            title="Session clips instead of arrangements"
            disabled={disabled}
            helperText="Export as session clips for live performance."
          />
          <CheckBox
            checked={groupTracks}
            onChange={onGroupTracksChange}
            title="Group tracks"
            disabled={disabled}
            helperText="Tracks will be grouped by their groups (A, B, C, D) same as on the device."
          />
          <CheckBox
            checked={sendEffects}
            onChange={onSendEffectsChange}
            title="Send effects"
            disabled={disabled}
            helperText="Return track with effect will be added. Each individual track will be sending to the return track. If you select «Group tracks», each group will send its audio to the return track."
          />
        </>
      )}

      {format === 'reaper' && (
        <>
          <CheckBox
            checked={includeArchivedSamples}
            onChange={onIncludeArchivedSamplesChange}
            title="Include samples"
            disabled={disabled}
            helperText="Samples will be exported as WAV files and bundled with the project in Media/samples folder."
          />
          <CheckBox
            checked={groupTracks}
            onChange={onGroupTracksChange}
            title="Group tracks"
            disabled={disabled}
            helperText="Tracks will be grouped by their groups (A, B, C, D) same as on the device."
          />
        </>
      )}

      {format === 'midi' && (
        <>
          <CheckBox
            checked={includeArchivedSamples}
            onChange={onIncludeArchivedSamplesChange}
            title="Include archived WAV samples"
            disabled={disabled}
          />
          <CheckBox
            checked={drumRackGroupA}
            onChange={onDrumRackGroupAChange}
            title="Merge tracks of group A into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckBox
            checked={drumRackGroupB}
            onChange={onDrumRackGroupBChange}
            title="Merge tracks of group B into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckBox
            checked={drumRackGroupC}
            onChange={onDrumRackGroupCChange}
            title="Merge tracks of group C into one track"
            disabled={disabled}
            helperText="Useful for drum kits. Make sure your drum pads are not playing chromatically."
          />
          <CheckBox
            checked={drumRackGroupD}
            onChange={onDrumRackGroupDChange}
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
