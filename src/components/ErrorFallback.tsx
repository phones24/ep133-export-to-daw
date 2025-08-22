import Button from './ui/Button';

function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white border-1 border-black p-6 flex flex-col gap-4">
        <h1 className="text-xl font-medium">Something went wrong</h1>

        <div className="mb-4 text-sm text-red-700 mb-2">
          An unexpected error occurred. Please try refreshing the page.
        </div>

        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
