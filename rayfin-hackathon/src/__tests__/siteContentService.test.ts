import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteSettings } from '@/content/defaultContent';
import type { ContentBlockRecord } from '@/types/site';

const getRayfinClientMock = vi.fn();

vi.mock('@/services/rayfinClient', () => ({
  getRayfinClient: getRayfinClientMock,
}));

const missingSubmitDeadlineError = new Error(
  'GraphQL errors: The field `submitDeadline` does not exist on the type `SiteSettings`.'
);
const missingRegistrationOpenError = new Error(
  'GraphQL errors: The field `registrationOpen` does not exist on the type `SiteSettings`.'
);

function createMockClient() {
  const siteSettingsSelect = vi.fn();
  const siteSettingsCreate = vi.fn();
  const siteSettingsUpdate = vi.fn();
  const contentBlockCreate = vi.fn().mockResolvedValue(undefined);
  const contentBlockUpdate = vi.fn().mockResolvedValue(undefined);
  const contentBlocksExecute = vi.fn().mockResolvedValue([]);
  const timelineExecute = vi.fn().mockResolvedValue([]);
  const adminExecute = vi.fn().mockResolvedValue([]);
  const judgeExecute = vi.fn().mockResolvedValue([]);

  return {
    client: {
      data: {
        SiteSettings: {
          select: siteSettingsSelect,
          create: siteSettingsCreate,
          update: siteSettingsUpdate,
        },
        ContentBlock: {
          create: contentBlockCreate,
          update: contentBlockUpdate,
          select: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              execute: contentBlocksExecute,
            })),
          })),
        },
        TimelineMilestone: {
          select: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              execute: timelineExecute,
            })),
          })),
        },
        AdminEmail: {
          select: vi.fn(() => ({
            execute: adminExecute,
          })),
        },
        JudgeEmail: {
          select: vi.fn(() => ({
            execute: judgeExecute,
          })),
          create: vi.fn(),
          delete: vi.fn(),
        },
      },
    },
    siteSettingsSelect,
    siteSettingsCreate,
    siteSettingsUpdate,
    contentBlockCreate,
    contentBlockUpdate,
  };
}

describe('site content service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('falls back to the legacy SiteSettings selection when submitDeadline is missing', async () => {
    const { client, siteSettingsSelect } = createMockClient();
    getRayfinClientMock.mockReturnValue(client);

    siteSettingsSelect
      .mockReturnValueOnce({
        execute: vi.fn().mockRejectedValue(missingSubmitDeadlineError),
      })
      .mockReturnValueOnce({
        execute: vi.fn().mockResolvedValue([
          {
            id: defaultSiteSettings.id,
            siteTitle: 'Custom title',
          },
        ]),
      });

    const { fetchSiteContent } = await import('@/services/siteContent');
    const snapshot = await fetchSiteContent(true);

    expect(snapshot.settings?.siteTitle).toBe('Custom title');
    expect(snapshot.settings?.submitDeadline).toBe(defaultSiteSettings.submitDeadline);
    expect(siteSettingsSelect).toHaveBeenCalledTimes(2);
    expect(siteSettingsSelect.mock.calls[0]?.[0]).toContain('submitDeadline');
    expect(siteSettingsSelect.mock.calls[1]?.[0]).not.toContain('submitDeadline');
  });

  it('falls back when event controls have not been applied to the backend yet', async () => {
    const { client, siteSettingsSelect } = createMockClient();
    getRayfinClientMock.mockReturnValue(client);

    siteSettingsSelect
      .mockReturnValueOnce({
        execute: vi.fn().mockRejectedValue(missingRegistrationOpenError),
      })
      .mockReturnValueOnce({
        execute: vi.fn().mockResolvedValue([{ id: defaultSiteSettings.id }]),
      });

    const { fetchSiteContent } = await import('@/services/siteContent');
    const snapshot = await fetchSiteContent(true);

    expect(snapshot.settings?.registrationOpen).toBe(true);
    expect(snapshot.settings?.submissionOpen).toBe(true);
    expect(snapshot.settings?.resultsPublished).toBe(false);
    expect(siteSettingsSelect.mock.calls[1]?.[0]).not.toContain('registrationOpen');
  });

  it('requires the latest schema before closing registration', async () => {
    const { client, siteSettingsUpdate } = createMockClient();
    getRayfinClientMock.mockReturnValue(client);
    siteSettingsUpdate.mockRejectedValueOnce(missingRegistrationOpenError);

    const { updateSiteSettings } = await import('@/services/siteContent');

    await expect(
      updateSiteSettings({
        ...defaultSiteSettings,
        registrationOpen: false,
      })
    ).rejects.toThrow(
      'The current Rayfin SiteSettings schema does not include event controls and results yet.'
    );
  });

  it('retries SiteSettings updates without submitDeadline when the backend schema is older', async () => {
    const { client, siteSettingsUpdate } = createMockClient();
    getRayfinClientMock.mockReturnValue(client);

    siteSettingsUpdate
      .mockRejectedValueOnce(missingSubmitDeadlineError)
      .mockResolvedValueOnce(undefined);

    const { updateSiteSettings } = await import('@/services/siteContent');
    await updateSiteSettings(defaultSiteSettings);

    expect(siteSettingsUpdate).toHaveBeenCalledTimes(2);
    expect(siteSettingsUpdate.mock.calls[0]?.[1]).toHaveProperty('submitDeadline', '');
    expect(siteSettingsUpdate.mock.calls[1]?.[1]).not.toHaveProperty('submitDeadline');
  });

  it('surfaces a schema upgrade error when saving a non-empty submission deadline', async () => {
    const { client, siteSettingsUpdate } = createMockClient();
    getRayfinClientMock.mockReturnValue(client);

    siteSettingsUpdate.mockRejectedValueOnce(missingSubmitDeadlineError);

    const { updateSiteSettings } = await import('@/services/siteContent');

    await expect(
      updateSiteSettings({
        ...defaultSiteSettings,
        submitDeadline: '2026-07-01T12:00:00.000Z',
      })
    ).rejects.toThrow(
      'The current Rayfin SiteSettings schema does not include submitDeadline yet. Run `rayfin up` to apply the latest schema, then try again.'
    );

    expect(siteSettingsUpdate).toHaveBeenCalledTimes(1);
  });

  it('times out when site content loading never resolves', async () => {
    vi.useFakeTimers();
    try {
      const { client, siteSettingsSelect } = createMockClient();
      getRayfinClientMock.mockReturnValue(client);

      siteSettingsSelect.mockReturnValue({
        execute: vi.fn(() => new Promise(() => undefined)),
      });

      const { fetchSiteContent } = await import('@/services/siteContent');
      const pendingFetch = expect(fetchSiteContent(true)).rejects.toThrow(
        'Hackathon content took too long to load. The page is showing default content for now.'
      );

      await vi.advanceTimersByTimeAsync(10000);
      await pendingFetch;
    } finally {
      vi.useRealTimers();
    }
  });

  it('accepts recording links longer than 500 characters', async () => {
    const { client, contentBlockCreate } = createMockClient();
    getRayfinClientMock.mockReturnValue(client);

    const recordingBlock: ContentBlockRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      pageKey: 'resources',
      blockKind: 'recording',
      title: 'Deep dive replay',
      body: 'Watch the replay for the full walkthrough.',
      ctaLabel: 'Watch recording',
      ctaUrl: `https://example.com/${'r'.repeat(580)}`,
      sortOrder: 4,
    };

    const { createContentBlock } = await import('@/services/siteContent');
    await createContentBlock(recordingBlock);

    expect(contentBlockCreate).toHaveBeenCalledWith(recordingBlock);
  });

  it('rejects content block links that exceed the supported maximum length', async () => {
    const { client, contentBlockCreate } = createMockClient();
    getRayfinClientMock.mockReturnValue(client);

    const recordingBlock: ContentBlockRecord = {
      id: '22222222-2222-4222-8222-222222222222',
      pageKey: 'resources',
      blockKind: 'recording',
      title: 'Deep dive replay',
      body: 'Watch the replay for the full walkthrough.',
      ctaLabel: 'Watch recording',
      ctaUrl: `https://example.com/${'r'.repeat(2100)}`,
      sortOrder: 4,
    };

    const { createContentBlock } = await import('@/services/siteContent');

    await expect(createContentBlock(recordingBlock)).rejects.toThrow(
      'Link URL must be 2048 characters or fewer.'
    );
    expect(contentBlockCreate).not.toHaveBeenCalled();
  });
});
