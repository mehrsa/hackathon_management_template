import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  canHideDefaultBlock,
  emptyPersistedState,
  isDefaultAdminId,
  isDefaultBlockId,
  isDefaultTimelineId,
  mergeSiteData,
} from '@/content/defaultContent';
import {
  createAdminEmail,
  createContentBlock,
  createJudgeEmail,
  createSiteSettings,
  createTimelineMilestone,
  deleteAdminEmail,
  deleteContentBlock,
  deleteJudgeEmail,
  deleteTimelineMilestone,
  fetchSiteContent,
  updateContentBlock,
  updateSiteSettings,
  updateTimelineMilestone,
} from '@/services/siteContent';
import {
  getRuntimeDefaultSiteData,
  writeSiteDefaultSnapshot,
} from '@/services/siteDefaultSnapshot';
import type {
  AdminEmailRecord,
  ContentBlockRecord,
  JudgeEmailRecord,
  PersistedSiteState,
  SiteData,
  SiteSettingsRecord,
  TimelineMilestoneRecord,
} from '@/types/site';

interface UseSiteContentOptions {
  includeAdminEmails: boolean;
}

export function useSiteContent({ includeAdminEmails }: UseSiteContentOptions) {
  const [siteData, setSiteData] = useState<SiteData>(() => getRuntimeDefaultSiteData());
  const [persisted, setPersisted] = useState<PersistedSiteState>(emptyPersistedState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySnapshot = useCallback((snapshot: Awaited<ReturnType<typeof fetchSiteContent>>) => {
    const mergedSiteData = mergeSiteData(
      snapshot.settings,
      snapshot.blocks,
      snapshot.timeline,
      snapshot.adminEmails,
      snapshot.judgeEmails
    );
    setPersisted(snapshot.persisted);
    setSiteData(mergedSiteData);
    writeSiteDefaultSnapshot(mergedSiteData);
  }, []);

  const syncPersistedContent = useCallback(async () => {
    const snapshot = await fetchSiteContent(includeAdminEmails);
    applySnapshot(snapshot);
  }, [applySnapshot, includeAdminEmails]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!includeAdminEmails) {
      setPersisted(emptyPersistedState);
      setSiteData(getRuntimeDefaultSiteData());
      setLoading(false);
      return;
    }

    try {
      await syncPersistedContent();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load hackathon content.'
      );
    } finally {
      setLoading(false);
    }
  }, [includeAdminEmails, syncPersistedContent]);

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
        await syncPersistedContent();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to save site settings.'
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.hasSettings, syncPersistedContent]
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
        await syncPersistedContent();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save content.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.blockIds, syncPersistedContent]
  );

  const removeBlock = useCallback(
    async (id: string) => {
      const block = siteData.blocks.find((item) => item.id === id);

      if (!block) {
        throw new Error('Content block could not be found.');
      }

      const canHideDefaultPageBlock = canHideDefaultBlock(block);

      if (isDefaultBlockId(id) && !canHideDefaultPageBlock) {
        throw new Error('Default content blocks cannot be deleted.');
      }

      setSaving(true);
      setError(null);

      try {
        if (canHideDefaultPageBlock) {
          const hiddenBlock = { ...block, isHidden: true };

          if (persisted.blockIds.includes(id)) {
            await updateContentBlock(hiddenBlock);
          } else {
            await createContentBlock(hiddenBlock);
          }
        } else if (persisted.blockIds.includes(id)) {
          await deleteContentBlock(id);
        }
        await syncPersistedContent();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete content.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.blockIds, siteData.blocks, syncPersistedContent]
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

        setSiteData((current) => {
          const nextSiteData = {
            ...current,
            timeline: mergeSiteData(
              current.settings,
              current.blocks,
              current.timeline.filter((item) => item.id !== milestone.id).concat(milestone),
              current.adminEmails,
              current.judgeEmails
            ).timeline,
          };
          writeSiteDefaultSnapshot(nextSiteData);
          return nextSiteData;
        });
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
        setSiteData((current) => {
          const nextSiteData = {
            ...current,
            timeline: current.timeline.filter((item) => item.id !== id),
          };
          writeSiteDefaultSnapshot(nextSiteData);
          return nextSiteData;
        });
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
        setSiteData((current) => {
          const nextSiteData = mergeSiteData(
            current.settings,
            current.blocks,
            current.timeline,
            current.adminEmails.concat(adminEmail),
            current.judgeEmails
          );
          writeSiteDefaultSnapshot(nextSiteData);
          return nextSiteData;
        });
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
        setSiteData((current) => {
          const nextSiteData = mergeSiteData(
            current.settings,
            current.blocks,
            current.timeline,
            current.adminEmails.filter((entry) => entry.id !== id),
            current.judgeEmails
          );
          writeSiteDefaultSnapshot(nextSiteData);
          return nextSiteData;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to remove admin email.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.adminIds]
  );

  const addJudge = useCallback(
    async (judgeEmail: JudgeEmailRecord) => {
      setSaving(true);
      setError(null);

      try {
        await createJudgeEmail(judgeEmail);
        setPersisted((current) => ({
          ...current,
          judgeIds: current.judgeIds.concat(judgeEmail.id),
        }));
        setSiteData((current) => ({
          ...current,
          judgeEmails: current.judgeEmails.concat(judgeEmail).sort((left, right) =>
            left.email.localeCompare(right.email)
          ),
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to add judge email.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const removeJudge = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);

      try {
        if (persisted.judgeIds.includes(id)) {
          await deleteJudgeEmail(id);
        }
        setPersisted((current) => ({
          ...current,
          judgeIds: current.judgeIds.filter((value) => value !== id),
        }));
        setSiteData((current) => ({
          ...current,
          judgeEmails: current.judgeEmails.filter((entry) => entry.id !== id),
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to remove judge email.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [persisted.judgeIds]
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
      addJudge,
      removeJudge,
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
      addJudge,
      removeJudge,
    ]
  );
}
