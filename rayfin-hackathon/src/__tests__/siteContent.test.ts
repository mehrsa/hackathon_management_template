import { describe, expect, it } from 'vitest';

import {
  defaultAdminEmails,
  defaultSiteSettings,
  getBlocksForPage,
  isAdminEmail,
  mergeSiteData,
} from '@/content/defaultContent';

describe('site content defaults', () => {
  it('keeps the default admin and matches email checks case-insensitively', () => {
    expect(isAdminEmail('MGOLESTANEH@MICROSOFT.COM', defaultAdminEmails)).toBe(true);
    expect(isAdminEmail('someone@example.com', defaultAdminEmails)).toBe(false);
  });

  it('merges custom content over defaults and keeps items ordered', () => {
    const merged = mergeSiteData(
      {
        ...defaultSiteSettings,
        bannerTitle: 'Updated title',
        homeIntroTitle: 'Updated welcome title',
        navBuildLabel: 'Updated build label',
      },
      [
        {
          id: '33333333-3333-4333-8333-222222222222',
          pageKey: 'build',
          blockKind: 'idea',
          title: 'Updated build card',
          body: 'Updated body',
          sortOrder: 2,
        },
        {
          id: '88888888-8888-4888-8888-111111111111',
          pageKey: 'build',
          blockKind: 'idea',
          title: 'New build card',
          body: 'Extra build guidance',
          sortOrder: 10,
        },
      ],
      [],
      [
        {
          id: '99999999-9999-4999-8999-111111111111',
          email: 'judge@example.com',
          addedByEmail: 'mgolestaneh@microsoft.com',
        },
      ]
    );

    expect(merged.settings.bannerTitle).toBe('Updated title');
    expect(merged.settings.homeIntroTitle).toBe('Updated welcome title');
    expect(merged.settings.navBuildLabel).toBe('Updated build label');
    expect(getBlocksForPage(merged.blocks, 'build')[1].title).toBe('Updated build card');
    expect(getBlocksForPage(merged.blocks, 'build').at(-1)?.title).toBe('New build card');
    expect(isAdminEmail('judge@example.com', merged.adminEmails)).toBe(true);
    expect(isAdminEmail('mgolestaneh@microsoft.com', merged.adminEmails)).toBe(true);
  });

  it('keeps default text when persisted settings contain null optional fields', () => {
    const merged = mergeSiteData(
      {
        ...defaultSiteSettings,
        homeIntroBody: null as never,
        homeExploreTitle: null as never,
        navBuildLabel: 'Updated build label',
      },
      [],
      [],
      []
    );

    expect(merged.settings.homeIntroBody).toBe(defaultSiteSettings.homeIntroBody);
    expect(merged.settings.homeExploreTitle).toBe(defaultSiteSettings.homeExploreTitle);
    expect(merged.settings.navBuildLabel).toBe('Updated build label');
  });

  it('omits default build cards when a persisted hidden override exists', () => {
    const merged = mergeSiteData(
      null,
      [
        {
          id: '33333333-3333-4333-8333-111111111111',
          pageKey: 'build',
          blockKind: 'idea',
          title: 'Operational copilots',
          body: 'Hidden',
          isHidden: true,
          sortOrder: 1,
        },
      ],
      [],
      []
    );

    expect(getBlocksForPage(merged.blocks, 'build')).toHaveLength(3);
    expect(merged.blocks.some((block) => block.id === '33333333-3333-4333-8333-111111111111')).toBe(
      false
    );
  });
});
