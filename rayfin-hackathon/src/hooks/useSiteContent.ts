import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  defaultSiteData,
  emptyPersistedState,
  isDefaultAdminId,
  isDefaultBlockId,
  isDefaultTimelineId,
  mergeSiteData,
} from '@/content/defaultContent';
import {
  createAdminEmail,
  createContentBlock,
  createSiteSettings,
  createTimelineMilestone,
  deleteAdminEmail,
  deleteContentBlock,
  deleteTimelineMilestone,
  fetchSiteContent,
  updateContentBlock,
  updateSiteSettings,
  updateTimelineMilestone,
} from '@/services/siteContent';
import type {
  AdminEmailRecord,
  ContentBlockRecord,
  PersistedSiteState,
  SiteData,
  SiteSettingsRecord,
  TimelineMilestoneRecord,
} from '@/types/site';

interface UseSiteContentOptions {
  includeAdminEmails: boolean;
}

export function useSiteContent({ includeAdminEmails }: UseSiteContentOptions) {
  const [siteData, setSiteData] = useState<SiteData>(defaultSiteData);
  const [persisted, setPersisted] = useState<PersistedSiteState>(emptyPersistedState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!includeAdminEmails) {
      setPersisted(emptyPersistedState);
      setSiteData(defaultSiteData);
      setLoading(false);
      return;
    }

    try {
      const snapshot = await fetchSiteContent(includeAdminEmails);
      setPersisted(snapshot.persisted);
      setSiteData(
        mergeSiteData(
          snapshot.settings,
          snapshot.blocks,
          snapshot.timeline,
          snapshot.adminEmails
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load hackathon content.'
      );
    } finally {
      setLoading(false);
    }
  }, [includeAdminEmails]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveSettings = useCallback(
    async (settings: SiteSettingsRecord) => {
      setSaving(true);
      setError(null);

      try {
        if (persisted.hasSettings) {
          await updateSiteSettings(settings);
        } else {
          await createSiteSettings(settings);
        }

        setPersisted((current) => ({ ...current, hasSettings: true }));
        setSiteData((current) => ({ ...current, settings }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to save site settings.'
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.hasSettings]
  );

  const saveBlock = useCallback(
    async (block: ContentBlockRecord) => {
      setSaving(true);
      setError(null);

      try {
        if (persisted.blockIds.includes(block.id)) {
          await updateContentBlock(block);
        } else {
          await createContentBlock(block);
        }

        setPersisted((current) => ({
          ...current,
          blockIds: current.blockIds.includes(block.id)
            ? current.blockIds
            : [...current.blockIds, block.id],
        }));

        setSiteData((current) => ({
          ...current,
          blocks: mergeSiteData(
            current.settings,
            current.blocks.filter((item) => item.id !== block.id).concat(block),
            current.timeline,
            current.adminEmails
          ).blocks,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save content.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.blockIds]
  );

  const removeBlock = useCallback(
    async (id: string) => {
      const block = siteData.blocks.find((item) => item.id === id);

      if (!block) {
        throw new Error('Content block could not be found.');
      }

      const canHideDefaultBuildIdea =
        isDefaultBlockId(id) && block.pageKey === 'build' && block.blockKind === 'idea';

      if (isDefaultBlockId(id) && !canHideDefaultBuildIdea) {
        throw new Error('Default content blocks cannot be deleted.');
      }

      setSaving(true);
      setError(null);

      try {
        if (canHideDefaultBuildIdea) {
          const hiddenBlock = { ...block, isHidden: true };

          if (persisted.blockIds.includes(id)) {
            await updateContentBlock(hiddenBlock);
          } else {
            await createContentBlock(hiddenBlock);
          }
        } else if (persisted.blockIds.includes(id)) {
          await deleteContentBlock(id);
        }

        setPersisted((current) =>
          canHideDefaultBuildIdea
            ? {
                ...current,
                blockIds: current.blockIds.includes(id)
                  ? current.blockIds
                  : current.blockIds.concat(id),
              }
            : {
                ...current,
                blockIds: current.blockIds.filter((value) => value !== id),
              }
        );
        setSiteData((current) => ({
          ...current,
          blocks: current.blocks.filter((item) => item.id !== id),
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete content.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.blockIds, siteData.blocks]
  );

  const saveTimelineMilestone = useCallback(
    async (milestone: TimelineMilestoneRecord) => {
      setSaving(true);
      setError(null);

      try {
        if (persisted.timelineIds.includes(milestone.id)) {
          await updateTimelineMilestone(milestone);
        } else {
          await createTimelineMilestone(milestone);
        }

        setPersisted((current) => ({
          ...current,
          timelineIds: current.timelineIds.includes(milestone.id)
            ? current.timelineIds
            : [...current.timelineIds, milestone.id],
        }));

        setSiteData((current) => ({
          ...current,
          timeline: mergeSiteData(
            current.settings,
            current.blocks,
            current.timeline.filter((item) => item.id !== milestone.id).concat(milestone),
            current.adminEmails
          ).timeline,
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to save timeline milestone.'
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.timelineIds]
  );

  const removeTimelineMilestone = useCallback(
    async (id: string) => {
      if (isDefaultTimelineId(id)) {
        throw new Error('Default timeline milestones cannot be deleted.');
      }

      setSaving(true);
      setError(null);

      try {
        if (persisted.timelineIds.includes(id)) {
          await deleteTimelineMilestone(id);
        }

        setPersisted((current) => ({
          ...current,
          timelineIds: current.timelineIds.filter((value) => value !== id),
        }));
        setSiteData((current) => ({
          ...current,
          timeline: current.timeline.filter((item) => item.id !== id),
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to delete timeline milestone.'
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.timelineIds]
  );

  const addAdmin = useCallback(
    async (adminEmail: AdminEmailRecord) => {
      setSaving(true);
      setError(null);

      try {
        await createAdminEmail(adminEmail);

        setPersisted((current) => ({
          ...current,
          adminIds: current.adminIds.concat(adminEmail.id),
        }));
        setSiteData((current) =>
          mergeSiteData(
            current.settings,
            current.blocks,
            current.timeline,
            current.adminEmails.concat(adminEmail)
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to add admin email.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const removeAdmin = useCallback(
    async (id: string) => {
      if (isDefaultAdminId(id)) {
        throw new Error('The default admin email cannot be removed.');
      }

      setSaving(true);
      setError(null);

      try {
        if (persisted.adminIds.includes(id)) {
          await deleteAdminEmail(id);
        }

        setPersisted((current) => ({
          ...current,
          adminIds: current.adminIds.filter((value) => value !== id),
        }));
        setSiteData((current) =>
          mergeSiteData(
            current.settings,
            current.blocks,
            current.timeline,
            current.adminEmails.filter((entry) => entry.id !== id)
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to remove admin email.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.adminIds]
  );

  return useMemo(
    () => ({
      siteData,
      persisted,
      loading,
      saving,
      error,
      refresh,
      saveSettings,
      saveBlock,
      removeBlock,
      saveTimelineMilestone,
      removeTimelineMilestone,
      addAdmin,
      removeAdmin,
    }),
    [
      siteData,
      persisted,
      loading,
      saving,
      error,
      refresh,
      saveSettings,
      saveBlock,
      removeBlock,
      saveTimelineMilestone,
      removeTimelineMilestone,
      addAdmin,
      removeAdmin,
    ]
  );
}
