import { CONTENT_BLOCK_LIMITS } from '@/constants/contentBlockLimits';
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

const legacySiteSettingsFields = [
  'id',
  'siteTitle',
  'siteDescription',
  'navBuildLabel',
  'navJudgingLabel',
  'navSubmitLabel',
  'navProjectsLabel',
  'heroBadge',
  'bannerTitle',
  'bannerDescription',
  'bannerImageUrl',
  'registerUrl',
  'homeIntroTitle',
  'homeIntroBody',
  'homeExploreTitle',
  'homeExploreBuildDescription',
  'homeExploreJudgingDescription',
  'homeExploreSubmitDescription',
  'homeExploreProjectsDescription',
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
  'buildIntro',
  'judgingIntro',
  'submitIntro',
] as const;

const siteSettingsFields = [...legacySiteSettingsFields, 'submitDeadline'] as const;

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
const siteContentTimeoutMs = 10000;

export interface SiteContentSnapshot {
  settings: SiteSettingsRecord | null;
  blocks: ContentBlockRecord[];
  timeline: TimelineMilestoneRecord[];
  adminEmails: AdminEmailRecord[];
  persisted: PersistedSiteState;
}

let submitDeadlineSupported: boolean | null = null;

function toPageKey(value: string): PageKey {
  if (
    value === 'home' ||
    value === 'build' ||
    value === 'judging' ||
    value === 'submit' ||
    value === 'resources'
  ) {
    return value;
  }

  throw new Error(`Unsupported page key "${value}" received from the backend.`);
}

function toBlockKind(value: string): BlockKind {
  if (
    value === 'goal' ||
    value === 'idea' ||
    value === 'criterion' ||
    value === 'reward' ||
    value === 'submission' ||
    value === 'resource' ||
    value === 'recording' ||
    value === 'upcomingSession' ||
    value === 'resourceLibrarySection' ||
    value === 'resourceRecordingsSection' ||
    value === 'resourceUpcomingSessionsSection'
  ) {
    return value;
  }

  throw new Error(`Unsupported content block kind "${value}" received from the backend.`);
}

function isMissingSubmitDeadlineError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message.includes('submitDeadline') &&
    error.message.includes('SiteSettings') &&
    error.message.includes('does not exist')
  );
}

function createSubmitDeadlineSchemaError(): Error {
  return new Error(
    'The current Rayfin SiteSettings schema does not include submitDeadline yet. Run `rayfin up` to apply the latest schema, then try again.'
  );
}

function omitSubmitDeadline(settings: SiteSettingsRecord): Omit<SiteSettingsRecord, 'submitDeadline'> {
  const { submitDeadline: _submitDeadline, ...legacySettings } = settings;
  return legacySettings;
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value : '';
}

function normalizeOptionalText(value: string | null | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function validateMaxLength(label: string, value: string | undefined, max: number) {
  if (value && value.length > max) {
    throw new Error(`${label} must be ${max} characters or fewer.`);
  }
}

function validateContentBlock(block: ContentBlockRecord) {
  validateMaxLength('Title', block.title, CONTENT_BLOCK_LIMITS.title);
  validateMaxLength('Body', block.body, CONTENT_BLOCK_LIMITS.body);
  validateMaxLength('Image URL', block.imageUrl, CONTENT_BLOCK_LIMITS.imageUrl);
  validateMaxLength('Button label', block.ctaLabel, CONTENT_BLOCK_LIMITS.ctaLabel);
  validateMaxLength('Link URL', block.ctaUrl, CONTENT_BLOCK_LIMITS.ctaUrl);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== null) {
      clearTimeout(timer);
    }
  }
}

async function fetchSiteSettings(client: ReturnType<typeof getRayfinClient>) {
  const fields = submitDeadlineSupported === false ? legacySiteSettingsFields : siteSettingsFields;

  try {
    const rows = await client.data.SiteSettings.select(fields).execute();
    submitDeadlineSupported = fields === siteSettingsFields ? true : submitDeadlineSupported;
    return rows;
  } catch (error) {
    if (submitDeadlineSupported === false || !isMissingSubmitDeadlineError(error)) {
      throw error;
    }

    submitDeadlineSupported = false;
    return client.data.SiteSettings.select(legacySiteSettingsFields).execute();
  }
}

async function persistSiteSettings(
  operation: 'create' | 'update',
  settings: SiteSettingsRecord
) {
  const client = getRayfinClient();

  if (submitDeadlineSupported === false) {
    if (settings.submitDeadline) {
      throw createSubmitDeadlineSchemaError();
    }

    if (operation === 'create') {
      await client.data.SiteSettings.create(omitSubmitDeadline(settings));
      return;
    }

    await client.data.SiteSettings.update({ id: settings.id }, omitSubmitDeadline(settings));
    return;
  }

  try {
    if (operation === 'create') {
      await client.data.SiteSettings.create(settings);
    } else {
      await client.data.SiteSettings.update({ id: settings.id }, settings);
    }

    submitDeadlineSupported = true;
  } catch (error) {
    if (!isMissingSubmitDeadlineError(error)) {
      throw error;
    }

    submitDeadlineSupported = false;

    if (settings.submitDeadline) {
      throw createSubmitDeadlineSchemaError();
    }

    if (operation === 'create') {
      await client.data.SiteSettings.create(omitSubmitDeadline(settings));
      return;
    }

    await client.data.SiteSettings.update({ id: settings.id }, omitSubmitDeadline(settings));
  }
}

export async function fetchSiteContent(
  includeAdminEmails: boolean
): Promise<SiteContentSnapshot> {
  const client = getRayfinClient();

  const [settingsRows, blockRows, timelineRows, adminRows] = await withTimeout(
    Promise.all([
      fetchSiteSettings(client),
      client.data.ContentBlock.select(contentBlockFields)
        .orderBy({ sortOrder: 'asc' })
        .execute(),
      client.data.TimelineMilestone.select(timelineFields)
        .orderBy({ sortOrder: 'asc' })
        .execute(),
      includeAdminEmails
        ? client.data.AdminEmail.select(adminEmailFields).execute()
        : Promise.resolve([]),
    ]),
    siteContentTimeoutMs,
    'Hackathon content took too long to load. The page is showing default content for now.'
  );

  return {
    settings: settingsRows[0]
      ? mergeDefinedValues(defaultSiteSettings, settingsRows[0])
      : null,
    blocks: blockRows.map((row) => ({
      ...row,
      pageKey: toPageKey(row.pageKey),
      blockKind: toBlockKind(row.blockKind),
      title: normalizeText(row.title),
      body: normalizeText(row.body),
      imageUrl: normalizeOptionalText(row.imageUrl),
      ctaLabel: normalizeOptionalText(row.ctaLabel),
      ctaUrl: normalizeOptionalText(row.ctaUrl),
      isHidden: row.isHidden ?? undefined,
    })),
    timeline: timelineRows.map((row) => ({
      ...row,
      dateLabel: normalizeText(row.dateLabel),
      milestone: normalizeText(row.milestone),
      description: normalizeText(row.description),
    })),
    adminEmails: adminRows.map((row) => ({
      ...row,
      email: normalizeText(row.email),
      addedByEmail: normalizeText(row.addedByEmail),
    })),
    persisted: {
      hasSettings: settingsRows.length > 0,
      blockIds: blockRows.map((item) => item.id),
      timelineIds: timelineRows.map((item) => item.id),
      adminIds: adminRows.map((item) => item.id),
    },
  };
}

export async function createSiteSettings(settings: SiteSettingsRecord) {
  await persistSiteSettings('create', settings);
}

export async function updateSiteSettings(settings: SiteSettingsRecord) {
  await persistSiteSettings('update', settings);
}

export async function createContentBlock(block: ContentBlockRecord) {
  validateContentBlock(block);
  const client = getRayfinClient();
  await client.data.ContentBlock.create(block);
}

export async function updateContentBlock(block: ContentBlockRecord) {
  validateContentBlock(block);
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
