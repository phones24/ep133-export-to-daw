import { useAtom } from 'jotai';
import { Link } from 'wouter';
import { feedbackDialogAtom } from '~/atoms/feedbackDialog';
import Donate from './Donate';

const menuItemClassName =
  'text-black underline hover:no-underline cursor-pointer px-1 font-semibold';

function Menu() {
  const [_, openFeedbackDialog] = useAtom(feedbackDialogAtom);

  return (
    <div className="bg-face px-3 py-2 border border-black shadow-my flex justify-center">
      <Link href="/faq" className={menuItemClassName}>
        FAQ
      </Link>
      |
      <button type="button" className={menuItemClassName} onClick={() => openFeedbackDialog(true)}>
        Feedback
      </button>
      |
      <Donate className={menuItemClassName} />|
      <a
        className={menuItemClassName}
        href="https://github.com/phones24/ep133-export-to-daw"
        target="_blank"
        rel="noopener noreferrer"
        title="View on GitHub"
      >
        GitHub
      </a>
      |
      <a href="mailto:ep133todaw@proton.me" title="Mail me" className={menuItemClassName}>
        Email
      </a>
    </div>
  );
}

export default Menu;
