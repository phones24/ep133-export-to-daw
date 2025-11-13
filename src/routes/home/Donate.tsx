import clsx from 'clsx';
import { useState } from 'preact/hooks';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';

type Wallet = {
  currency: string;
  address: string;
  label: string;
};

const WALLETS: Wallet[] = [
  {
    currency: 'BTC',
    address: 'bc1qclpnhdlvk607llzuux609nezay8fk3vyhphgsr',
    label: 'BTC',
  },
  {
    currency: 'ETH',
    address: '0x3f8072285e1C3a2F651bF98A5A839f6cFf8C4047',
    label: 'ETH',
  },
  {
    currency: 'USDT TRC20',
    address: 'TDqf9eJPGWPZafP3ASS37r2cWvkKsp1aL8',
    label: 'USDT',
  },
];

function Donate({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (address: string, label: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <>
      <button
        type="button"
        className={clsx(className, 'italic animate-pulse-slow')}
        onClick={() => setOpen(true)}
      >
        Donate!
      </button>
      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-2 min-w-[600px]">
          <h1 className="text-xl font-semibold">Donate</h1>
          <p>If you like this tool, please consider donating to support the development.</p>
          <p>Thank you!</p>

          <div className="mt-10">
            <h2 className="text-xl leading-12">Crypto</h2>
            <ul className="space-y-3">
              {WALLETS.map((wallet) => (
                <li key={wallet.label} className="flex items-center gap-2">
                  <span className="font-medium">{wallet.currency}:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(wallet.address, wallet.label)}
                    className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm font-mono transition-colors cursor-pointer select-all"
                    title="Copy address"
                  >
                    {wallet.address}
                  </button>
                  {copiedAddress === wallet.label && (
                    <span className="text-green-600 text-sm font-medium">✓ Copied!</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl leading-12">Ko-fi</h2>
            <a href="https://ko-fi.com/M4M11KIZGJ" target="_blank" rel="noopener noreferrer">
              <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="ko-fi" />
            </a>
          </div>

          <div className="flex gap-4 justify-end mt-20">
            <Button onClick={() => setOpen(false)} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default Donate;
