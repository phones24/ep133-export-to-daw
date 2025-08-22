import { toXML } from 'jstoxml';
import JSZip from 'jszip';
import { Sound } from '../hooks/useAllSounds';
import { ProjectRawData } from '../hooks/useProject';
import dawProjectTransformer from './dawProjectTransformer';

const xmlConfig = {
  indent: '    ',
  header: true,
};

export function buildMetadataXml() {
  const xml = toXML(
    {
      MetaData: {
        Title: '',
        Artist: '',
        Album: '',
        OriginalArtist: '',
        Songwriter: '',
        Producer: '',
        Year: '',
        Genre: '',
        Copyright: '',
        Comment: 'Made with EP-133 K.O. II: Export To DAW',
      },
    },
    xmlConfig,
  );
  return new Blob([xml], { type: 'text/xml' });
}

export async function buildProjectXml(projectData: ProjectRawData, sounds: Sound[]) {
  // const transformedData = dawProjectTransformer(projectData, sounds);

  const xml = toXML(
    {
      _name: 'Project',
      _version: '1.0',
      _content: '',
    },
    xmlConfig,
  );

  return new Blob([xml], { type: 'text/xml' });
}

export async function exportDawProject(data: ProjectRawData, sounds: Sound[]) {
  const metadataXml = await buildMetadataXml();
  const projectXml = await buildProjectXml(data, sounds);

  console.log(await metadataXml.text());
  console.log(await projectXml.text());

  const zip = new JSZip();

  zip.file('metadata.xml', metadataXml);
  zip.file('project.xml', projectXml);

  const res = zip.generateAsync({ type: 'blob' });

  return;
}
