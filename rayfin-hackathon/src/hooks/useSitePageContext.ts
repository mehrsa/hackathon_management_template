import { useOutletContext } from 'react-router-dom';

import type { SitePageContextValue } from '@/components/SiteLayout';

export function useSitePageContext() {
  return useOutletContext<SitePageContextValue>();
}
