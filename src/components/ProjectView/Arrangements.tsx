import useProject from '../../hooks/useProject';
import { getQuarterNotesPerBar } from '../../lib/exporters/utils';
import webViewTransformer from '../../lib/transformers/webView';
import { Bar } from './Bar';
import { SingleNote } from './SingleNote';
import Track from './Track';
import TrackMeta from './TrackMeta';

function Arrangements({ projectId }: { projectId: string }) {
  const { data } = useProject(projectId);

  if (!data) {
    return null;
  }

  const transformedData = webViewTransformer(data);
  const barLength =
    getQuarterNotesPerBar(
      transformedData.scenesSettings.timeSignature.numerator,
      transformedData.scenesSettings.timeSignature.denominator,
    ) * 4;

  return (
    <div className="flex gap-4">
      {transformedData.scenes.map((sceneData) => (
        <div className="flex flex-col gap-2">
          <div className="bg-brand p-2 font-semibold text-white">
            <div className="inline sticky left-0">SCENE {sceneData.name}</div>
          </div>
          {sceneData.patterns.map((pattern) => (
            <div className="flex gap-2">
              <TrackMeta pattern={pattern} />
              <div
                style={{ width: sceneData.maxBars * barLength * 24 }}
                className="overflow-hidden"
              >
                <Track>
                  {[...Array(sceneData.maxBars).keys()].map((index) => (
                    <Bar length={pattern.bars} barLength={barLength} index={index}>
                      {pattern.notes.map((note) => (
                        <SingleNote key={`${note.note}-${note.position}`} note={note} />
                      ))}
                    </Bar>
                  ))}
                </Track>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Arrangements;
