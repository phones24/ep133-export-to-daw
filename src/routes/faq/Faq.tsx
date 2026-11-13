import IconArrowLeft from '~/components/icons/arrow-left.svg?react';
import Button from '~/components/ui/Button';
import { usePageMeta } from '~/hooks/usePageMeta';
import { createFaqStructuredData } from '~/lib/pageStructuredData';

const faqContent = [
  {
    question: 'Why the resulting project doesn’t sound the same as on the device?',
    answer:
      '<p>Several reasons. The main one is that the EP devices uses a custom FX processor that is hard to recreate in a DAW one to one. Also, fader automation is not exported yet, so if you used fader automation, the result will differ. Sample stretching algorithms are different as well.</p><p>Initially this project was intended to export notes and samples so you could continue working in a DAW. I personally use the EP133 mainly for sketching ideas, not for finishing tracks. Later, many people asked to export with FX applied, so I added FX export as well. Still, the sound will not be exactly the same.</p>',
  },
  {
    question: 'Please add support for [my DAW here]',
    answer:
      '<p>I’d love to. Reverse engineering DAW project formats takes a tremendous amount of time and effort. It’s easier for DAWs that uses text, XML or JSON formats (like REAPER or Ableton). For proprietary binary formats, it’s much more challenging. But if you have a specific DAW in mind, let me know.</p><p>If your DAW is not supported natively, you can always export to MIDI. Every DAW supports MIDI today. Also check DAWproject - lots of DAWs supports it.</p>',
  },
  {
    question: 'Can I export audio for individual tracks with this tool?',
    answer:
      "<p>No. If you're thinking of something like Overbridge - it is not possible, the device cannot stream multichannel audio directly to your DAW. You need to record tracks manually, one by one, muting the others.</p>",
  },
  {
    question: 'I found a bug or the page crashed. What should I do?',
    answer:
      '<p>PLEASE submit a report. There are several ways to do it:</p><ul><li>Open an issue on <a href="https://github.com/phones24/ep133-export-to-daw" target="_blank" rel="noopener noreferrer">GitHub</a></li><li>Email me at <a href="mailto:ep133todaw@proton.me">ep133todaw@proton.me</a></li><li>Use the "Feedback" button on the main page</li></ul><p>I can only fix issues if you report them, so please do. I don’t have a QA team to test the app thoroughly, so your help is very much appreciated.</p>',
  },
  {
    question: 'Can I use this tool without connecting my device?',
    answer:
      "<p>Yes! You can drop a <code>.pak</code> backup file directly onto the page. The backup file contains all your projects and samples, so you can browse and export them without connecting your device. To create a backup file, use the official EP Sample Tool from Teenage Engineering.</p><p>Note: <code>.tar</code> and <code>.ppak</code> project files still require a device connection because they don't include the sample data.</p>",
  },
  {
    question: 'Is this officially approved by Teenage Engineering?',
    answer:
      '<p>No. This is an open source project made by a fan, not affiliated with Teenage Engineering in any way. Initially it used source code from the official EP SAMPLE TOOL that had been reverse engineered with help from AI, but the SysEx library has since been rewritten.</p><p>TE contacted me to ask for a disclaimer in a few places. That’s it. They’ve been chill about this project so far.</p>',
  },
];

const structuredData = createFaqStructuredData(faqContent);

function Faq() {
  usePageMeta({
    title: 'EP-133 Export to DAW FAQ | Ableton, REAPER & MIDI',
    description:
      'Answers about EP-133, EP-1320 and EP-40 project export, sound differences, DAW support, bug reports and backup files in the browser tool.',
    path: '/faq',
    structuredData,
  });

  return (
    <main className="my-4 max-w-250 bg-white border border-black p-4 mx-auto flex flex-col gap-6 shadow-my max-[1100px]:mx-4">
      <Button size="xs" className="mr-auto" to="/">
        <span className="inline-flex items-center gap-2">
          <IconArrowLeft className="w-4 h-4" />
          Back
        </span>
      </Button>

      <h1 className="text-2xl font-bold mb-4">EP-133 Export to DAW FAQ</h1>

      {faqContent.map(({ question, answer }) => (
        <section key={question}>
          <h2 className="text-xl font-semibold mb-2">{question}</h2>
          <div
            className="text-sm font-mono wrap-anywhere [&_p+p]:mt-4 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:my-2 [&_a]:text-blue-600 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: answer }}
          />
        </section>
      ))}
    </main>
  );
}

export default Faq;
