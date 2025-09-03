import useAllSounds from '../hooks/useAllSounds';
import useProject from '../hooks/useProject';
import webViewTransformer from '../lib/transformers/webView';
import { Bar } from './Bar';
import { SingleNote } from './SingleNote';
import Track from './Track';
import TrackMeta from './TrackMeta';

function Project({ projectId }: { projectId: string }) {
  const { data } = useProject(projectId);
  const { data: allSounds } = useAllSounds();

  if (!data || !allSounds) {
    return null;
  }

  return (
    <div className="flex gap-4">
      {webViewTransformer(data, allSounds).scenes.map((sceneData) => (
        <div className="flex flex-col gap-2">
          <div className="bg-[#ef4e27] p-2 font-semibold text-white">
            <div className="inline sticky left-0">SCENE {sceneData.name}</div>
          </div>
          {sceneData.patterns.map((pattern) => (
            <div className="flex gap-2">
              <TrackMeta pattern={pattern} />
              <div style={{ width: sceneData.maxBars * 16 * 24 }} className="overflow-hidden">
                <Track>
                  <Bar length={pattern.bars}>
                    {pattern.notes.map((note) => (
                      <SingleNote key={`${note.note}-${note.position}`} note={note} />
                    ))}
                  </Bar>
                </Track>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Project;
