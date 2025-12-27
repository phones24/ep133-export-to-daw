import useTheme from '~/hooks/useTheme';

function Layout({ children }: { children: preact.ComponentChildren }) {
  const theme = useTheme();
  return (
    <div className={`${theme.id} h-full w-full bg-(image:--bg-url) fixed overflow-y-auto`}>
      {children}
    </div>
  );
}

export default Layout;
