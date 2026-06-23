import { defaultSiteSettings, mergeDefinedValues } from '@/content/defaultContent';
import { getRayfinClient } from '@/services/rayfinClient';
import type {
  AdminEmailRecord,
  BlockKind,
  ContentBlockRecord,
  PageKey,
  PersistedSiteState,
  SiteSettingsRecord,
  TimelineMilestoneRecord,
} from '@/types/site';

const siteSettingsFields = [
  'id',
  'siteTitle',
  'siteDescription',
  'navBuildLabel',
  'navJudgingLabel',
  'navSubmitLabel',
  'heroBadge',
  'bannerTitle',
  'bannerDescription',
  'bannerImageUrl',
  'registerUrl',
  'homeIntroTitle',
  'homeIntroBody',
  'homeExploreTitle',
  'homeGoalsTitle',
  'homeTimelineTitle',
  'buildHeroTitle',
  'buildIdeasEyebrow',
  'buildIdeasTitle',
  'judgingHeroTitle',
  'judgingCriteriaEyebrow',
  'judgingCriteriaTitle',
  'submitHeroTitle',
  'submitChecklistEyebrow',
  'submitChecklistTitle',
  'submitReminderTitle',
  'buildIntro',
  'judgingIntro',
  'submitIntro',
] as const;

const contentBlockFields = [
  'id',
  'pageKey',
  'blockKind',
  'title',
  'body',
  'imageUrl',
  'ctaLabel',
  'ctaUrl',
  'isHidden',
  'sortOrder',
] as const;

const timelineFields = [
  'id',
  'dateLabel',
  'milestone',
  'description',
  'sortOrder',
] as const;

const adminEmailFields = ['id', 'email', 'addedByEmail'] as const;

export interface SiteContentSnapshot {
  settings: SiteSettingsRecord | null;
  blocks: ContentBlockRecord[];
  timeline: TimelineMilestoneRecord[];
  adminEmails: AdminEmailRecord[];
  persisted: PersistedSiteState;
}

function toPageKey(value: string): PageKey {
  if (value === 'home' || value === 'build' || value === 'judging' || value === 'submit') {
    return value;
  }

  throw new Error(`Unsupported page key "${value}" received from the backend.`);
}

function toBlockKind(value: string): BlockKind {
  if (
    value === 'goal' ||
    value === 'idea' ||
    value === 'criterion' ||
    value === 'submission'
  ) {
    return value;
  }

  throw new Error(`Unsupported content block kind "${value}" received from the backend.`);
}

export async function fetchSiteContent(
  includeAdminEmails: boolean
): Promise<SiteContentSnapshot> {
  const client = getRayfinClient();

  const [settingsRows, blockRows, timelineRows, adminRows] = await Promise.all([
    client.data.SiteSettings.select(siteSettingsFields).execute(),
    client.data.ContentBlock.select(contentBlockFields)
      .orderBy({ sortOrder: 'asc' })
      .execute(),
    client.data.TimelineMilestone.select(timelineFields)
      .orderBy({ sortOrder: 'asc' })
      .execute(),
    includeAdminEmails
      ? client.data.AdminEmail.select(adminEmailFields).execute()
      : Promise.resolve([]),
  ]);

  return {
    settings: settingsRows[0]
      ? mergeDefinedValues(defaultSiteSettings, settingsRows[0])
      : null,
    blocks: blockRows.map((row) => ({
      ...row,
      pageKey: toPageKey(row.pageKey),
      blockKind: toBlockKind(row.blockKind),
      isHidden: row.isHidden ?? undefined,
    })),
    timeline: timelineRows,
    adminEmails: adminRows,
    persisted: {
      hasSettings: settingsRows.length > 0,
      blockIds: blockRows.map((item) => item.id),
      timelineIds: timelineRows.map((item) => item.id),
      adminIds: adminRows.map((item) => item.id),
    },
  };
}

export async function createSiteSettings(settings: SiteSettingsRecord) {
  const client = getRayfinClient();
  await client.data.SiteSettings.create(settings);
}

export async function updateSiteSettings(settings: SiteSettingsRecord) {
  const client = getRayfinClient();
  await client.data.SiteSettings.update({ id: settings.id }, settings);
}

export async function createContentBlock(block: ContentBlockRecord) {
  const client = getRayfinClient();
  await client.data.ContentBlock.create(block);
}

export async function updateContentBlock(block: ContentBlockRecord) {
  const client = getRayfinClient();
  await client.data.ContentBlock.update({ id: block.id }, block);
}

export async function deleteContentBlock(id: string) {
  const client = getRayfinClient();
  await client.data.ContentBlock.delete({ id });
}

export async function createTimelineMilestone(milestone: TimelineMilestoneRecord) {
  const client = getRayfinClient();
  await client.data.TimelineMilestone.create(milestone);
}

export async function updateTimelineMilestone(milestone: TimelineMilestoneRecord) {
  const client = getRayfinClient();
  await client.data.TimelineMilestone.update({ id: milestone.id }, milestone);
}

export async function deleteTimelineMilestone(id: string) {
  const client = getRayfinClient();
  await client.data.TimelineMilestone.delete({ id });
}

export async function createAdminEmail(adminEmail: AdminEmailRecord) {
  const client = getRayfinClient();
  await client.data.AdminEmail.create(adminEmail);
}

export async function deleteAdminEmail(id: string) {
  const client = getRayfinClient();
  await client.data.AdminEmail.delete({ id });
}
