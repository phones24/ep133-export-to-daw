import { useEffect, useState } from 'preact/hooks';
import Button from '~/components/ui/Button';
import Dialog from '../../components/ui/Dialog';

const DIALOG_VERSION = 2;
const DIALOG_STORAGE_KEY = 'eptoolkit-dialog-shown';

const SCREENSHOTS = [
  {
    src: '/eptoolkit/eptoolkit-01-800.webp',
    label: 'Projects',
    alt: 'EP Toolkit showing projects on a connected EP-133',
  },
  {
    src: '/eptoolkit/eptoolkit-04-800.webp',
    label: 'Samples',
    alt: 'EP Toolkit sample browser with audio processing tools and waveform previews',
  },
  {
    src: '/eptoolkit/eptoolkit-10-800.webp',
    label: 'Scene editor',
    alt: 'EP Toolkit project editor showing scenes and patterns',
  },
];

const FEATURES = [
  'Play projects, scenes and patterns inside the app, with EP-40 Supertone support.',
  'Batch-transfer samples, trim silence, normalize, or process audio with CLAP plugins.',
  'Reassign patterns and reorder scenes, then save your edits to the device or a backup.',
  'Back up a single project or the whole device. Export projects and samples from backups without connecting your EP.',
];

function EPToolkitDialog() {
  const [open, setOpen] = useState(false);
  const [screenshotIndex, setScreenshotIndex] = useState(0);
  const screenshot = SCREENSHOTS[screenshotIndex];

  useEffect(() => {
    if (Number(localStorage.getItem(DIALOG_STORAGE_KEY)) !== DIALOG_VERSION) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(DIALOG_STORAGE_KEY, String(DIALOG_VERSION));
    setOpen(false);
  };

  return (
    <Dialog
      isOpen={open}
      onClose={handleClose}
      className="w-240 max-w-[calc(100vw-2rem)] shadow-[6px_6px_0_#00000055]"
      containerClassName="bg-creme! p-0! rounded-none! min-w-0! bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:40px_40px]"
    >
      <header className="flex items-center justify-between gap-6 border-b border-black px-6 py-4 max-sm:flex-col max-sm:items-start max-sm:gap-3 max-sm:p-4">
        <img
          src="/eptoolkit/full-logo.svg"
          alt="EP Toolkit"
          width={993}
          height={302}
          className="h-14 w-auto"
        />
        <span className="border border-black/20 bg-white/60 px-3 py-2 text-xs">
          Windows / macOS / Linux
        </span>
      </header>

      <div className="grid grid-cols-2 gap-7 p-6 max-sm:grid-cols-1 max-sm:p-4">
        <section aria-labelledby="eptoolkit-heading" className="min-w-0">
          <h3
            id="eptoolkit-heading"
            className="border-l-4 border-brand pl-4 text-3xl font-bold leading-tight tracking-tight max-sm:text-2xl"
          >
            DAW export &amp; sample editing for your EP
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-black/75">
            I built EP Toolkit for EP-133, EP-1320 and EP-40. It's a standalone desktop app, so you
            don't need a browser.
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 size-2 shrink-0 bg-brand" aria-hidden="true" />
              <span>
                Export to <strong>Ableton Live, FL Studio, REAPER, DAWproject or MIDI</strong>.
              </span>
            </li>
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-1.5 size-2 shrink-0 bg-brand" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex min-w-0 flex-col gap-4">
          <figure className="border border-black bg-[#293b4b] p-2 shadow-my">
            <img
              src={screenshot.src}
              alt={screenshot.alt}
              width={800}
              height={500}
              className="aspect-8/5 w-full"
            />
            <figcaption className="mt-2 flex gap-1">
              {SCREENSHOTS.map((item, index) => (
                <button
                  key={item.src}
                  type="button"
                  aria-pressed={screenshotIndex === index}
                  onClick={() => setScreenshotIndex(index)}
                  className={`flex-1 cursor-pointer px-2 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    screenshotIndex === index
                      ? 'bg-creme text-black'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </figcaption>
          </figure>

          <p className="text-sm leading-relaxed text-black/75">
            Exports have more features than the web version, including fader automation, track
            selection, track colors and saving straight to a folder.
          </p>
        </div>
      </div>

      <footer className="flex items-center justify-end gap-4 border-t border-black bg-white/50 px-6 py-4 max-sm:p-4">
        <div className="flex items-center gap-3 max-sm:w-full max-sm:flex-col max-sm:items-stretch">
          <Button onClick={handleClose} variant="ghost">
            Back to the exporter
          </Button>
          <a
            href="https://eptoolkit.ep133-to-daw.cc/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="inline-flex h-10.5 items-center justify-center border border-black bg-brand px-5 text-sm font-bold text-white shadow-my transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          >
            Try EP Toolkit
          </a>
        </div>
      </footer>
    </Dialog>
  );
}

export default EPToolkitDialog;
