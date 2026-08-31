import { CONTENT_BLOCK_LIMITS } from '@/constants/contentBlockLimits';
import { defaultSiteSettings, mergeDefinedValues } from '@/content/defaultContent';
import { getRayfinClient } from '@/services/rayfinClient';
import type {
  AdminEmailRecord,
  BlockKind,
  ContentBlockRecord,
  JudgeEmailRecord,
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
const currentSiteSettingsFields = [...siteSettingsFields, 'judgingFormPublished'] as const;
const latestSiteSettingsFields = [
  ...currentSiteSettingsFields,
  'registrationOpen',
  'submissionOpen',
  'resultsPublished',
  'honorableMentionSubmissionIds',
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
const judgeEmailFields = ['id', 'email', 'addedByEmail'] as const;
const siteContentTimeoutMs = 10000;

export interface SiteContentSnapshot {
  settings: SiteSettingsRecord | null;
  blocks: ContentBlockRecord[];
  timeline: TimelineMilestoneRecord[];
  adminEmails: AdminEmailRecord[];
  judgeEmails: JudgeEmailRecord[];
  persisted: PersistedSiteState;
}

let submitDeadlineSupported: boolean | null = null;
let judgingFormPublishedSupported: boolean | null = null;
let resultControlsSupported: boolean | null = null;

function isMissingJudgeEmailEntityError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message.includes('JudgeEmail') &&
    error.message.includes('does not exist')
  );
}

function createJudgeEmailSchemaError(): Error {
  return new Error(
    'The current Rayfin schema does not include judge access yet. Run `rayfin up` to apply the latest schema, then try again.'
  );
}

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

function isMissingJudgingFormPublishedError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message.includes('judgingFormPublished') &&
    error.message.includes('SiteSettings') &&
    error.message.includes('does not exist')
  );
}

function isMissingResultControlsError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message.includes('SiteSettings') &&
    error.message.includes('does not exist') &&
    [
      'registrationOpen',
      'submissionOpen',
      'resultsPublished',
      'honorableMentionSubmissionIds',
    ].some((field) => error.message.includes(field))
  );
}

function createSubmitDeadlineSchemaError(): Error {
  return new Error(
    'The current Rayfin SiteSettings schema does not include submitDeadline yet. Run `rayfin up` to apply the latest schema, then try again.'
  );
}

function createJudgingFormSchemaError(): Error {
  return new Error(
    'The current Rayfin SiteSettings schema does not include judgingFormPublished yet. Run `rayfin up` to apply the latest schema, then try again.'
  );
}

function createResultControlsSchemaError(): Error {
  return new Error(
    'The current Rayfin SiteSettings schema does not include event controls and results yet. Run `rayfin up` to apply the latest schema, then try again.'
  );
}

function omitSubmitDeadline<T extends { submitDeadline: string }>(
  settings: T
): Omit<T, 'submitDeadline'> {
  const { submitDeadline: _submitDeadline, ...legacySettings } = settings;
  return legacySettings;
}

function omitJudgingFormPublished<T extends { judgingFormPublished: boolean }>(
  settings: T
): Omit<T, 'judgingFormPublished'> {
  const { judgingFormPublished: _judgingFormPublished, ...legacySettings } = settings;
  return legacySettings;
}

function omitResultControls(
  settings: SiteSettingsRecord
): Omit<
  SiteSettingsRecord,
  | 'registrationOpen'
  | 'submissionOpen'
  | 'resultsPublished'
  | 'honorableMentionSubmissionIds'
> {
  const {
    registrationOpen: _registrationOpen,
    submissionOpen: _submissionOpen,
    resultsPublished: _resultsPublished,
    honorableMentionSubmissionIds: _honorableMentionSubmissionIds,
    ...legacySettings
  } = settings;
  return legacySettings;
}

function hasNonDefaultResultControls(settings: SiteSettingsRecord): boolean {
  return (
    !settings.registrationOpen ||
    !settings.submissionOpen ||
    settings.resultsPublished ||
    Boolean(settings.honorableMentionSubmissionIds)
  );
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
  const fields =
    resultControlsSupported !== false
      ? latestSiteSettingsFields
      : submitDeadlineSupported === false
      ? legacySiteSettingsFields
      : judgingFormPublishedSupported === false
        ? siteSettingsFields
        : currentSiteSettingsFields;

  try {
    const rows = await client.data.SiteSettings.select(fields).execute();
    submitDeadlineSupported = fields !== legacySiteSettingsFields ? true : submitDeadlineSupported;
    judgingFormPublishedSupported =
      fields === currentSiteSettingsFields || fields === latestSiteSettingsFields
        ? true
        : judgingFormPublishedSupported;
    resultControlsSupported =
      fields === latestSiteSettingsFields ? true : resultControlsSupported;
    return rows;
  } catch (error) {
    if (resultControlsSupported !== false && isMissingResultControlsError(error)) {
      resultControlsSupported = false;
      return fetchSiteSettings(client);
    }

    if (judgingFormPublishedSupported !== false && isMissingJudgingFormPublishedError(error)) {
      judgingFormPublishedSupported = false;
      return fetchSiteSettings(client);
    }

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

  if (resultControlsSupported === false && hasNonDefaultResultControls(settings)) {
    throw createResultControlsSchemaError();
  }

  if (judgingFormPublishedSupported === false && settings.judgingFormPublished) {
    throw createJudgingFormSchemaError();
  }

  const persistingResultControls = resultControlsSupported !== false;
  const persistingJudgingForm = judgingFormPublishedSupported !== false;
  const controlsPayload =
    persistingResultControls ? settings : omitResultControls(settings);
  const payload =
    persistingJudgingForm ? controlsPayload : omitJudgingFormPublished(controlsPayload);

  if (submitDeadlineSupported === false) {
    if (settings.submitDeadline) {
      throw createSubmitDeadlineSchemaError();
    }

    if (operation === 'create') {
      await client.data.SiteSettings.create(omitSubmitDeadline(payload));
      return;
    }

    await client.data.SiteSettings.update({ id: settings.id }, omitSubmitDeadline(payload));
    return;
  }

  try {
    if (operation === 'create') {
      await client.data.SiteSettings.create(payload);
    } else {
      await client.data.SiteSettings.update({ id: settings.id }, payload);
    }

    submitDeadlineSupported = true;
    if (persistingJudgingForm) judgingFormPublishedSupported = true;
    if (persistingResultControls) resultControlsSupported = true;
  } catch (error) {
    if (resultControlsSupported !== false && isMissingResultControlsError(error)) {
      resultControlsSupported = false;
      return persistSiteSettings(operation, settings);
    }

    if (judgingFormPublishedSupported !== false && isMissingJudgingFormPublishedError(error)) {
      judgingFormPublishedSupported = false;
      return persistSiteSettings(operation, settings);
    }

    if (!isMissingSubmitDeadlineError(error)) {
      throw error;
    }

    submitDeadlineSupported = false;

    if (settings.submitDeadline) {
      throw createSubmitDeadlineSchemaError();
    }

    if (operation === 'create') {
      await client.data.SiteSettings.create(omitSubmitDeadline(payload));
      return;
    }

    await client.data.SiteSettings.update({ id: settings.id }, omitSubmitDeadline(payload));
  }
}

export async function fetchSiteContent(
  includeAdminEmails: boolean
): Promise<SiteContentSnapshot> {
  const client = getRayfinClient();

  const [settingsRows, blockRows, timelineRows, adminRows, judgeRows] = await withTimeout(
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
      includeAdminEmails
        ? client.data.JudgeEmail.select(judgeEmailFields)
            .execute()
            .catch((error) => {
              if (isMissingJudgeEmailEntityError(error)) {
                return [];
              }
              throw error;
            })
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
    judgeEmails: judgeRows.map((row) => ({
      ...row,
      email: normalizeText(row.email),
      addedByEmail: normalizeText(row.addedByEmail),
    })),
    persisted: {
      hasSettings: settingsRows.length > 0,
      blockIds: blockRows.map((item) => item.id),
      timelineIds: timelineRows.map((item) => item.id),
      adminIds: adminRows.map((item) => item.id),
      judgeIds: judgeRows.map((item) => item.id),
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

export async function createJudgeEmail(judgeEmail: JudgeEmailRecord) {
  const client = getRayfinClient();
  try {
    await client.data.JudgeEmail.create(judgeEmail);
  } catch (error) {
    if (isMissingJudgeEmailEntityError(error)) {
      throw createJudgeEmailSchemaError();
    }
    throw error;
  }
}

export async function deleteJudgeEmail(id: string) {
  const client = getRayfinClient();
  try {
    await client.data.JudgeEmail.delete({ id });
  } catch (error) {
    if (isMissingJudgeEmailEntityError(error)) {
      throw createJudgeEmailSchemaError();
    }
    throw error;
  }
}
