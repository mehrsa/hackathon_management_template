import { describe, expect, it } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import {
  getRuntimeDefaultSiteData,
  readSiteDefaultSnapshot,
  writeSiteDefaultSnapshot,
} from '@/services/siteDefaultSnapshot';

describe('site default snapshot', () => {
  it('uses the saved live content snapshot as the runtime default', () => {
    writeSiteDefaultSnapshot({
      ...defaultSiteData,
      settings: {
        ...defaultSiteData.settings,
        bannerTitle: 'Current live banner',
      },
      blocks: defaultSiteData.blocks.map((block) =>
        block.id === '33333333-3333-4333-8333-111111111111'
          ? { ...block, body: '**Sharper** build guidance' }
          : block
      ),
    });

    expect(readSiteDefaultSnapshot()?.settings.bannerTitle).toBe('Current live banner');
    expect(getRuntimeDefaultSiteData().settings.bannerTitle).toBe('Current live banner');
  });

  it('falls back to repository defaults when the cached snapshot is invalid', () => {
    localStorage.setItem('rayfin-site-content-defaults-v1', '{invalid-json');

    expect(readSiteDefaultSnapshot()).toBeNull();
    expect(getRuntimeDefaultSiteData().settings.bannerTitle).toBe(
      defaultSiteData.settings.bannerTitle
    );
    expect(localStorage.getItem('rayfin-site-content-defaults-v1')).toBeNull();
  });
});
