import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData, emptyPersistedState } from '@/content/defaultContent';
import { useSiteContent } from '@/hooks/useSiteContent';
import type { ContentBlockRecord } from '@/types/site';

const {
  fetchSiteContentMock,
  createContentBlockMock,
  updateContentBlockMock,
  deleteContentBlockMock,
  writeSiteDefaultSnapshotMock,
} = vi.hoisted(() => ({
  fetchSiteContentMock: vi.fn(),
  createContentBlockMock: vi.fn(),
  updateContentBlockMock: vi.fn(),
  deleteContentBlockMock: vi.fn(),
  writeSiteDefaultSnapshotMock: vi.fn(),
}));

vi.mock('@/services/siteContent', () => ({
  fetchSiteContent: fetchSiteContentMock,
  createSiteSettings: vi.fn(),
  updateSiteSettings: vi.fn(),
  createContentBlock: createContentBlockMock,
  updateContentBlock: updateContentBlockMock,
  deleteContentBlock: deleteContentBlockMock,
  createTimelineMilestone: vi.fn(),
  updateTimelineMilestone: vi.fn(),
  deleteTimelineMilestone: vi.fn(),
  createAdminEmail: vi.fn(),
  deleteAdminEmail: vi.fn(),
}));

vi.mock('@/services/siteDefaultSnapshot', () => ({
  getRuntimeDefaultSiteData: () => defaultSiteData,
  writeSiteDefaultSnapshot: writeSiteDefaultSnapshotMock,
}));

describe('useSiteContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('re-syncs build cards from persisted content after saving a new block', async () => {
    const newBlock: ContentBlockRecord = {
      id: '88888888-8888-4888-8888-111111111111',
      pageKey: 'build',
      blockKind: 'idea',
      title: 'New build card',
      body: 'Persisted guidance from Rayfin.',
      sortOrder: 10,
    };

    fetchSiteContentMock
      .mockResolvedValueOnce({
        settings: null,
        blocks: [],
        timeline: [],
        adminEmails: [],
        persisted: emptyPersistedState,
      })
      .mockResolvedValueOnce({
        settings: null,
        blocks: [newBlock],
        timeline: [],
        adminEmails: [],
        persisted: {
          ...emptyPersistedState,
          blockIds: [newBlock.id],
        },
      });

    const { result } = renderHook(() => useSiteContent({ includeAdminEmails: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.saveBlock(newBlock);
    });

    expect(createContentBlockMock).toHaveBeenCalledWith(newBlock);
    expect(updateContentBlockMock).not.toHaveBeenCalled();
    expect(fetchSiteContentMock).toHaveBeenCalledTimes(2);
    expect(result.current.persisted.blockIds).toContain(newBlock.id);
    expect(result.current.siteData.blocks.some((block) => block.id === newBlock.id)).toBe(true);
  });
});
