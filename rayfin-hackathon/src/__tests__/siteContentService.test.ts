import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteSettings } from '@/content/defaultContent';

const getRayfinClientMock = vi.fn();

vi.mock('@/services/rayfinClient', () => ({
  getRayfinClient: getRayfinClientMock,
}));

const missingSubmitDeadlineError = new Error(
  'GraphQL errors: The field `submitDeadline` does not exist on the type `SiteSettings`.'
);

function createMockClient() {
  const siteSettingsSelect = vi.fn();
  const siteSettingsCreate = vi.fn();
  const siteSettingsUpdate = vi.fn();
  const contentBlocksExecute = vi.fn().mockResolvedValue([]);
  const timelineExecute = vi.fn().mockResolvedValue([]);
  const adminExecute = vi.fn().mockResolvedValue([]);

  return {
    client: {
      data: {
        SiteSettings: {
          select: siteSettingsSelect,
          create: siteSettingsCreate,
          update: siteSettingsUpdate,
        },
        ContentBlock: {
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
      },
    },
    siteSettingsSelect,
    siteSettingsCreate,
    siteSettingsUpdate,
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
});
