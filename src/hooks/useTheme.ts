import { useAtomValue } from 'jotai';
import { useMemo } from 'preact/hooks';
import { useSearch } from 'wouter-preact';
import { deviceSkuAtom } from '~/atoms/deviceSku';
import { SKU_EP133, SKU_TO_NAME } from '~/lib/constants';

function useTheme(): { id: string; name: string } {
  const deviceSku = useAtomValue(deviceSkuAtom);
  const search = useSearch();

  const theme = useMemo(() => {
    const urlParams = new URLSearchParams(search);
    const themeParam = urlParams.get('theme');

    if (themeParam) {
      const themeEntry = Object.entries(SKU_TO_NAME).find(([, value]) => value.id === themeParam);
      if (themeEntry) {
        return themeEntry[1];
      }
    }

    return SKU_TO_NAME[deviceSku] || SKU_TO_NAME[SKU_EP133];
  }, [deviceSku, search]);

  return theme;
}

export default useTheme;
