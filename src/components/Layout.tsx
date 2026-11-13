import useTheme from '~/hooks/useTheme';

function Layout({ children }: { children: preact.ComponentChildren }) {
  const theme = useTheme();
  return (
    <div
      data-theme={theme.id}
      className="h-full w-full fixed overflow-y-auto bg-[url(/bg-ep133.png)] data-[theme=ep40]:[--color-brand:#ef4e27] data-[theme=ep40]:[--color-face:#e2d8c5] data-[theme=ep40]:[--color-screen:#00503a] data-[theme=ep40]:bg-[url(/bg-ep40.png)] data-[theme=ep1320]:[--color-brand:#b22e20] data-[theme=ep1320]:[--color-face:#b3ad8f] data-[theme=ep1320]:[--color-screen:#0c3235] data-[theme=ep1320]:bg-[url(/bg-ep1320.png)] [:where(&)_a]:text-blue-500"
    >
      {children}
    </div>
  );
}

export default Layout;
