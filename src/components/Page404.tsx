import { usePageMeta } from '~/hooks/usePageMeta';

function Page404() {
  usePageMeta({
    title: 'Page not found | EP-133: Export To DAW',
    description:
      'The page you are looking for does not exist. Open the EP-133: Export To DAW browser tool or read the FAQ.',
    path: window.location.pathname,
    noindex: true,
  });

  return (
    <div className="flex flex-col items-center justify-center h-dvh p-4">
      <div className="p-4 border border-black bg-white text-center max-w-md">
        <h1 className="text-2xl mb-4">404: Not Found</h1>
        <p>The page you are looking for does not exist.</p>
      </div>
    </div>
  );
}

export default Page404;
