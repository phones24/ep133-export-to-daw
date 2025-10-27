import IconArrowLeft from '~/components/icons/arrow-left.svg?react';
import Button from '~/components/ui/Button';

function Faq() {
  return (
    <main className="my-4 max-w-[1000px] bg-white h-full border-1 border-black p-4 mx-auto flex flex-col gap-6 shadow-my">
      <Button size="xs" className="mr-auto" to="/">
        <span className="inline-flex items-center gap-2">
          <IconArrowLeft className="w-4 h-4" />
          Back
        </span>
      </Button>

      <h1 className="text-2xl font-bold mb-4">FAQ</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">
          Why the resulting project doesn’t sound the same as on the device?
        </h2>
        <p className="text-sm font-mono">
          Several reasons. The main one is that the EP133 uses a custom FX processor that is hard to
          recreate in a DAW one to one. Also, fader automation is not exported yet, so if you used
          fader automation, the result will differ. Sample stretching algorithms are different as
          well.
          <br />
          <br />
          Initially this project was intended to export notes and samples so you could continue
          working in a DAW. I personally use the EP133 mainly for sketching ideas, not for finishing
          tracks. Later, many people asked to export with FX applied, so I added FX export as well.
          Still, the sound will not be exactly the same.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Please add support for [my DAW here]</h2>
        <p className="text-sm font-mono">
          I’d love to. Reverse engineering DAW project formats takes a tremendous amount of time and
          effort. It’s easier for DAWs that uses textXML, or JSON formats (like REAPER or Ableton).
          For proprietary binary formats, it’s much more challenging. But if you have a specific DAW
          in mind, let me know.
          <br />
          <br />
          If your DAW is not supported natively, you can always export to MIDI. Every DAW supports
          MIDI today. Also check DAWproject - lots of DAWs supports it.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">
          Can I export audio for individual tracks with this tool?
        </h2>
        <p className="text-sm font-mono">
          No. If you're thinking of something like Overbridge - it is not possible, the device
          cannot stream multichannel audio directly to your DAW. You need to record tracks manually,
          one by one, muting the others.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">
          I found a bug or the page crashed. What should I do?
        </h2>
        <p className="text-sm font-mono">
          PLEASE submit a report. There are several ways to do it:
        </p>

        <ul className="list-disc list-inside my-2 text-sm font-mono">
          <li>
            Open an issue on{' '}
            <a
              href="https://github.com/phones24/ep133-export-to-daw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              GitHub
            </a>
          </li>
          <li>
            Email me at{' '}
            <a href="mailto:ep133todaw@proton.me" className="text-blue-600 underline">
              ep133todaw@proton.me
            </a>
          </li>
          <li>Use the "Feedback" button on the main page</li>
        </ul>
        <p className="text-sm font-mono">
          I can only fix issues if you report them, so please do. I don’t have a QA team to test the
          app thoroughly, so your help is very much appreciated.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">
          Is this officially approved by Teenage Engineering?
        </h2>
        <p className="text-sm font-mono">
          No. This is an open source project made by a fan, not affiliated with Teenage Engineering
          in any way. Initially it used source code from the official EP SAMPLE TOOL that had been
          reverse engineered with help from AI, but the SysEx library has since been rewritten.
          <br />
          <br />
          TE contacted me to ask for a disclaimer in a few places. That’s it. They’ve been chill
          about this project so far.
        </p>
      </section>
    </main>
  );
}

export default Faq;
