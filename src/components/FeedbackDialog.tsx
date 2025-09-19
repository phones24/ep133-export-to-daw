import { useAtom, useAtomValue } from 'jotai';
import { useState } from 'preact/hooks';
import { feedbackDialogAtom } from '../atoms/feedbackDialog';
import { projectIdAtom } from '../atoms/project';
import useSubmitFeedback from '../hooks/useSubmitFeedback';
import { showToast } from '../lib/toast';
import Button from './ui/Button';
import CheckBox from './ui/CheckBox';
import Dialog from './ui/Dialog';
import FileInput from './ui/FileInput';
import Input from './ui/Input';

function FeedbackDialog() {
  const [open, setOpen] = useAtom(feedbackDialogAtom);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [attachProject, setAttachProject] = useState(true);
  const { mutate: submitErrorReport, isPending, isError } = useSubmitFeedback();
  const projectId = useAtomValue(projectIdAtom);

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    submitErrorReport(
      {
        description,
        email,
        files: files.length > 0 ? files : null,
        attachProject,
      },
      {
        onSuccess: () => {
          showToast('Feedback submitted successfully');

          setOpen(false);
          setDescription('');
          setEmail('');
          setFiles([]);
          setAttachProject(true);
        },
      },
    );
  };

  return (
    <Dialog isOpen={open} onClose={() => setOpen(false)}>
      <div className="flex flex-col gap-4 min-w-[600px]">
        <h3 className="text-lg font-semibold">Feedback / error report / feature request</h3>
        <p className="text-sm">
          If your project fails to export, or something looks wrong, please submit an error report
          to the developer. You can also use this form to send general feedback or request new
          features.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Message"
            type="textarea"
            value={description}
            disabled={isPending}
            onChange={(e: Event) => setDescription((e.target as HTMLTextAreaElement).value)}
            required
            rows={4}
          />
          <Input
            label="Your email (optional)"
            type="email"
            value={email}
            disabled={isPending}
            onChange={(e: Event) => setEmail((e.target as HTMLInputElement).value)}
          />
          <FileInput files={files} onFilesChange={setFiles} disabled={isPending} />
          <CheckBox
            title="Attach current project"
            checked={attachProject}
            onChange={setAttachProject}
            disabled={!projectId || isPending}
            helperText="If enabled, the selected project will be attached to the report. Useful for bug reports. I promise I remove it as soon as I fix the issue."
          />
          <div className="flex gap-4 justify-end mt-6">
            <Button
              onClick={() => setOpen(false)}
              variant="secondary"
              type="button"
              disabled={isPending}
            >
              Close
            </Button>
            <Button type="submit" disabled={isPending || description.trim() === ''}>
              {isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
        {isError && (
          <div className="my-4 bg-red-100/50 p-4 text-sm text-red-500 text-center">
            Failed to submit error report. Please try again.
          </div>
        )}
      </div>
    </Dialog>
  );
}

export default FeedbackDialog;
