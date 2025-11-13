import { useAtomValue } from 'jotai';
import { deviceSkuAtom } from '~/atoms/deviceSku';
import { SKU_EP133, SKU_TO_NAME } from '~/lib/constants';

function Layout({ children }: { children: preact.ComponentChildren }) {
  const deviceSku = useAtomValue(deviceSkuAtom);
  const theme = SKU_TO_NAME[deviceSku] || SKU_TO_NAME[SKU_EP133];
  return <div className={`${theme.id} h-full w-full bg-(image:--bg-url) fixed`}>{children}</div>;
}

export default Layout;
