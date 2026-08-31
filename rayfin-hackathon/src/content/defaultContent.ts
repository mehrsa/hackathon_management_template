import newBannerImage from '@/assets/new_banner_2.png';
import {
  DEFAULT_ADMIN_EMAIL,
  type AdminEmailRecord,
  type ContentBlockRecord,
  type JudgeEmailRecord,
  type PageKey,
  type PersistedSiteState,
  type SiteData,
  type SiteSettingsRecord,
  type TimelineMilestoneRecord,
  normalizeEmail,
} from '@/types/site';

const ids = {
  settings: '11111111-1111-4111-8111-111111111111',
  homeGoal1: '22222222-2222-4222-8222-111111111111',
  homeGoal2: '22222222-2222-4222-8222-222222222222',
  homeGoal3: '22222222-2222-4222-8222-333333333333',
  build1: '33333333-3333-4333-8333-111111111111',
  build2: '33333333-3333-4333-8333-222222222222',
  build3: '33333333-3333-4333-8333-333333333333',
  build4: '33333333-3333-4333-8333-444444444444',
  judging1: '44444444-4444-4444-8444-111111111111',
  judging2: '44444444-4444-4444-8444-222222222222',
  judging3: '44444444-4444-4444-8444-333333333333',
  judging4: '44444444-4444-4444-8444-444444444444',
  judgingReward: '44444444-4444-4444-8444-555555555555',
  submit1: '55555555-5555-4555-8555-111111111111',
  submit2: '55555555-5555-4555-8555-222222222222',
  submit3: '55555555-5555-4555-8555-333333333333',
  submit4: '55555555-5555-4555-8555-444444444444',
  resourcesLibrarySection: '88888888-8888-4888-8888-000000000001',
  resourcesRecordingsSection: '88888888-8888-4888-8888-000000000002',
  resourcesUpcomingSection: '88888888-8888-4888-8888-000000000003',
  resources1: '88888888-8888-4888-8888-111111111111',
  resources2: '88888888-8888-4888-8888-222222222222',
  resources3: '88888888-8888-4888-8888-333333333333',
  resourcesRecording1: '88888888-8888-4888-8888-444444444444',
  resourcesUpcoming1: '88888888-8888-4888-8888-555555555555',
  timeline1: '66666666-6666-4666-8666-111111111111',
  timeline2: '66666666-6666-4666-8666-222222222222',
  timeline3: '66666666-6666-4666-8666-333333333333',
  timeline4: '66666666-6666-4666-8666-444444444444',
  defaultAdmin: '77777777-7777-4777-8777-111111111111',
} as const;

export const defaultSiteSettings: SiteSettingsRecord = {
  id: ids.settings,
  siteTitle: 'Your Rayfin Hackathon',
  siteDescription:
    'Design, build, and launch Rayfin-powered experiences with guidance for teams, judges, and submitters in one place.',
  navBuildLabel: 'What you can build',
  navJudgingLabel: 'Judging Criteria & Rewards',
  navSubmitLabel: 'Submit your project',
  navProjectsLabel: 'Proposed projects',
  heroBadge: 'Hackathon Announcement',
  bannerTitle: 'Build standout apps with Rayfin',
  bannerDescription:
    'Bring your best product idea, prototype quickly with Rayfin, and showcase a polished solution to judges and peers during the Rayfin Hackathon.',
  bannerImageUrl: newBannerImage,
  registerUrl: 'https://example.com/rayfin-hackathon-register',
  homeIntroTitle: 'Welcome to Rayfin Hackathon!',
  homeIntroBody:
    'Use this site as the central source for the Rayfin Hackathon: announce the event, point builders to the right guidance, explain judging, and make submissions easy.',
  homeExploreTitle: 'What you need to know ...',
  homeExploreBuildDescription:
    'Examples and prompts to help teams choose a strong direction.',
  homeExploreJudgingDescription: 'A clear view of how entries will be evaluated.',
  homeExploreSubmitDescription: 'Everything teams need to include in the final handoff.',
  homeExploreProjectsDescription:
    'Browse submitted ideas, see who is building them, and find teams to join.',
  homeGoalsTitle: 'Hackathon Goals',
  homeTimelineTitle: 'Hackathon timeline and key milestones',
  buildHeroTitle: 'Choose a problem worth solving and show why your concept matters.',
  buildIdeasEyebrow: 'Build ideas',
  buildIdeasTitle: 'Example directions for teams',
  judgingHeroTitle:
    'Help judges see the quality, value, and thoughtfulness behind your work.',
  judgingCriteriaEyebrow: 'Criteria',
  judgingCriteriaTitle: 'What judges score',
  judgingFormPublished: false,
  registrationOpen: true,
  submissionOpen: true,
  resultsPublished: false,
  honorableMentionSubmissionIds: '',
  submitHeroTitle: 'Make your final handoff easy for judges to review and experience.',
  submitChecklistEyebrow: 'Submission checklist',
  submitChecklistTitle: 'What teams need to include',
  submitDeadline: '',
  buildIntro:
    'Your team can tackle business workflows, AI-assisted experiences, operational tooling, internal portals, or customer-facing apps as long as Rayfin is a meaningful part of the solution.',
  judgingIntro:
    'Projects will be scored on the clarity of the problem, strength of the implementation, thoughtful product decisions, and how convincingly the team uses Rayfin to speed delivery.',
  submitIntro:
    'Every submission should make it easy for judges to understand the problem, review the build, and try the experience without hunting through multiple threads or docs.',
};

export const defaultBlocks: ContentBlockRecord[] = [
  {
    id: ids.homeGoal1,
    pageKey: 'home',
    blockKind: 'goal',
    title: 'Accelerate delivery',
    body:
      'Ship a working experience fast by leaning on Rayfin for auth, data, and deployment so your team can focus on the product.',
    sortOrder: 1,
  },
  {
    id: ids.homeGoal2,
    pageKey: 'home',
    blockKind: 'goal',
    title: 'Solve real workflows',
    body:
      'Build something that improves a real business process, customer touchpoint, or internal productivity challenge.',
    sortOrder: 2,
  },
  {
    id: ids.homeGoal3,
    pageKey: 'home',
    blockKind: 'goal',
    title: 'Show polish and storytelling',
    body:
      'Deliver a clear narrative, thoughtful UX, and a demo that proves why your idea matters and why Rayfin made it possible.',
    sortOrder: 3,
  },
  {
    id: ids.build1,
    pageKey: 'build',
    blockKind: 'idea',
    title: 'Operational copilots',
    body:
      'Create task-focused tools for support, finance, procurement, or field teams with workflows, approvals, and traceable data.',
    sortOrder: 1,
  },
  {
    id: ids.build2,
    pageKey: 'build',
    blockKind: 'idea',
    title: 'Internal portals',
    body:
      'Launch a dashboard, request hub, or reporting workspace that unifies scattered processes into a single experience.',
    sortOrder: 2,
  },
  {
    id: ids.build3,
    pageKey: 'build',
    blockKind: 'idea',
    title: 'Customer-facing apps',
    body:
      'Prototype external experiences such as onboarding flows, self-service portals, knowledge assistants, or partner tools.',
    sortOrder: 3,
  },
  {
    id: ids.build4,
    pageKey: 'build',
    blockKind: 'idea',
    title: 'AI-infused productivity',
    body:
      'Combine Rayfin with AI features to summarize, recommend, route, or draft while keeping the full app workflow grounded in a useful product.',
    sortOrder: 4,
  },
  {
    id: ids.judging1,
    pageKey: 'judging',
    blockKind: 'criterion',
    title: 'Problem value',
    body:
      'How clearly does the team define the user problem and why this solution matters?',
    sortOrder: 1,
  },
  {
    id: ids.judging2,
    pageKey: 'judging',
    blockKind: 'criterion',
    title: 'Execution quality',
    body:
      'How complete, stable, and thoughtfully designed is the working product or prototype?',
    sortOrder: 2,
  },
  {
    id: ids.judging3,
    pageKey: 'judging',
    blockKind: 'criterion',
    title: 'Rayfin usage',
    body:
      'Does the project use Rayfin in a meaningful way that speeds development or improves the final experience?',
    sortOrder: 3,
  },
  {
    id: ids.judging4,
    pageKey: 'judging',
    blockKind: 'criterion',
    title: 'Demo and storytelling',
    body:
      'Is the submission easy to understand, compelling to watch, and supported by clear decisions and next steps?',
    sortOrder: 4,
  },
  {
    id: ids.judgingReward,
    pageKey: 'judging',
    blockKind: 'reward',
    title: 'Rewards and celebrating your success',
    body:
      'Winning teams can be recognized with prizes, shout-outs, leadership visibility, or showcase opportunities. Use this section to explain what success looks like after judging and how teams will be celebrated.',
    sortOrder: 5,
  },
  {
    id: ids.submit1,
    pageKey: 'submit',
    blockKind: 'submission',
    title: 'Submission checklist',
    body:
      'Include your project summary, primary demo or repository links, setup notes for judges, and the most important product feedback your team filed.',
    sortOrder: 1,
  },
  {
    id: ids.resourcesLibrarySection,
    pageKey: 'resources',
    blockKind: 'resourceLibrarySection',
    title: 'Learning Library',
    body: 'Docs, guides, repos, and quick references participants can use any time during the hackathon.',
    sortOrder: 1,
  },
  {
    id: ids.resourcesRecordingsSection,
    pageKey: 'resources',
    blockKind: 'resourceRecordingsSection',
    title: 'Recordings',
    body: 'Keep replays, walkthroughs, and demos in one place so nobody misses the key sessions.',
    sortOrder: 2,
  },
  {
    id: ids.resourcesUpcomingSection,
    pageKey: 'resources',
    blockKind: 'resourceUpcomingSessionsSection',
    title: 'Upcoming sessions',
    body: 'Share office hours and upcoming sessions here. Add the Teams meeting link to each card so attendees can open it or add it to their calendar.',
    sortOrder: 3,
  },
  {
    id: ids.resources1,
    pageKey: 'resources',
    blockKind: 'resource',
    title: 'Rayfin and Fabric documentation',
    body:
      'Start with the official documentation for Rayfin and Fabric concepts, product guidance, and core references teams can use while planning and building.',
    ctaLabel: 'Open docs',
    ctaUrl: 'https://learn.microsoft.com/fabric/',
    sortOrder: 1,
  },
  {
    id: ids.resources2,
    pageKey: 'resources',
    blockKind: 'resource',
    title: 'Build ideas and prompts',
    body:
      'Share internal starter prompts, prior examples, and your own guidance so teams can pick a direction faster and learn from previous work.',
    ctaLabel: 'Review build guidance',
    ctaUrl: '/build',
    sortOrder: 2,
  },
  {
    id: ids.resources3,
    pageKey: 'resources',
    blockKind: 'resource',
    title: 'Submission prep',
    body:
      'Keep the final checklist, judging expectations, and demo packaging notes in one place so participants know exactly how to finish strong.',
    ctaLabel: 'See submission page',
    ctaUrl: '/submit',
    sortOrder: 3,
  },
  {
    id: ids.resourcesRecording1,
    pageKey: 'resources',
    blockKind: 'recording',
    title: 'Kickoff session recording',
    body:
      'Post the session replay, demo walkthrough, or recap notes here so late joiners can catch up quickly.',
    ctaLabel: 'Watch recording',
    ctaUrl: 'https://example.com/rayfin-kickoff-recording',
    sortOrder: 1,
  },
  {
    id: ids.resourcesUpcoming1,
    pageKey: 'resources',
    blockKind: 'upcomingSession',
    title: 'Office hours',
    body:
      'Share the next live support session, what it will cover, and how participants should prepare before joining.',
    ctaLabel: 'Add to calendar',
    ctaUrl: 'https://teams.microsoft.com/l/meetup-join/example',
    sortOrder: 1,
  },
];

export const defaultTimeline: TimelineMilestoneRecord[] = [
  {
    id: ids.timeline1,
    dateLabel: 'Week 1',
    milestone: 'Kickoff announcement',
    description:
      'Theme, rules, judging expectations, and registration details are published on the main page.',
    sortOrder: 1,
  },
  {
    id: ids.timeline2,
    dateLabel: 'Week 1',
    milestone: 'Team formation checkpoint',
    description:
      'Participants finalize teams, confirm project direction, and align on the Rayfin capabilities they plan to use.',
    sortOrder: 2,
  },
  {
    id: ids.timeline3,
    dateLabel: 'Week 2',
    milestone: 'Build deadline',
    description:
      'Feature development wraps up and teams prepare the final walkthrough, screenshots, and submission materials.',
    sortOrder: 3,
  },
  {
    id: ids.timeline4,
    dateLabel: 'Week 3',
    milestone: 'Judging and winners',
    description:
      'Judges review entries, score submissions, and announce top projects and honorable mentions.',
    sortOrder: 4,
  },
];

export const defaultAdminEmails: AdminEmailRecord[] = [
  {
    id: ids.defaultAdmin,
    email: DEFAULT_ADMIN_EMAIL,
    addedByEmail: DEFAULT_ADMIN_EMAIL,
  },
];

export const defaultSiteData: SiteData = {
  settings: defaultSiteSettings,
  blocks: defaultBlocks,
  timeline: defaultTimeline,
  adminEmails: defaultAdminEmails,
  judgeEmails: [] as JudgeEmailRecord[],
};

export const emptyPersistedState: PersistedSiteState = {
  hasSettings: false,
  blockIds: [],
  timelineIds: [],
  adminIds: [],
  judgeIds: [],
};

export function getNavigationItems(settings: SiteSettingsRecord) {
  return [
    { to: '/judging', label: settings.navJudgingLabel },
    { to: '/build', label: settings.navBuildLabel },
    { to: '/resources', label: 'Resources' },
    { to: '/projects', label: settings.navProjectsLabel },
    { to: '/submit', label: settings.navSubmitLabel },
  ] as const;
}

export function getBlocksForPage(blocks: ContentBlockRecord[], pageKey: PageKey) {
  return blocks
    .filter((block) => block.pageKey === pageKey)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function isDefaultBlockId(id: string): boolean {
  return defaultBlocks.some((block) => block.id === id);
}

export function canHideDefaultBlock(block: ContentBlockRecord): boolean {
  if (!isDefaultBlockId(block.id)) {
    return false;
  }

  return (
    (block.pageKey === 'build' && block.blockKind === 'idea') ||
    (block.pageKey === 'judging' && block.blockKind === 'criterion') ||
    (block.pageKey === 'submit' && block.blockKind === 'submission') ||
    (block.pageKey === 'resources' &&
      (block.blockKind === 'resource' ||
        block.blockKind === 'recording' ||
        block.blockKind === 'upcomingSession'))
  );
}

export function isDefaultTimelineId(id: string): boolean {
  return defaultTimeline.some((item) => item.id === id);
}

export function isDefaultAdminId(id: string): boolean {
  return defaultAdminEmails.some((item) => item.id === id);
}

export function isAdminEmail(email: string | null | undefined, adminEmails: AdminEmailRecord[]) {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return adminEmails.some((entry) => normalizeEmail(entry.email) === normalized);
}

export function isJudgeEmail(
  email: string | null | undefined,
  judgeEmails: JudgeEmailRecord[]
) {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return judgeEmails.some((entry) => normalizeEmail(entry.email) === normalized);
}

export function mergeDefinedValues<T extends object>(
  defaults: T,
  overrides: Partial<T> | null | undefined
): T {
  if (!overrides) {
    return defaults;
  }

  const merged = { ...defaults };

  for (const [key, value] of Object.entries(overrides) as [
    keyof T,
    T[keyof T] | null | undefined,
  ][]) {
    if (value !== null && value !== undefined) {
      merged[key] = value;
    }
  }

  return merged;
}

function isLegacyBannerImageUrl(value: string): boolean {
  return /(^|[\\/])(rayfin|hacker-fish-banner|new_banner)(?:-[A-Za-z0-9_-]+)?\.png(?:[?#].*)?$/i.test(
    value
  );
}

function mergeSiteSettings(
  settings: Partial<SiteSettingsRecord> | SiteSettingsRecord | null | undefined
): SiteSettingsRecord {
  const merged = mergeDefinedValues(defaultSiteSettings, settings);

  if (isLegacyBannerImageUrl(merged.bannerImageUrl)) {
    return {
      ...merged,
      bannerImageUrl: defaultSiteSettings.bannerImageUrl,
    };
  }

  return merged;
}

function mergeCollection<T extends { id: string; sortOrder?: number }>(
  defaults: T[],
  overrides: T[]
) {
  const merged = new Map<string, T>();

  for (const item of defaults) {
    merged.set(item.id, item);
  }

  for (const item of overrides) {
    merged.set(item.id, item);
  }

  return Array.from(merged.values()).sort((left, right) => {
    const leftOrder = left.sortOrder ?? 0;
    const rightOrder = right.sortOrder ?? 0;
    return leftOrder - rightOrder;
  });
}

function mergeBlocks(defaults: ContentBlockRecord[], overrides: ContentBlockRecord[]) {
  const merged = new Map<string, ContentBlockRecord>();

  for (const item of defaults) {
    merged.set(item.id, item);
  }

  for (const item of overrides) {
    if (item.isHidden) {
      merged.delete(item.id);
      continue;
    }

    merged.set(item.id, item);
  }

  return Array.from(merged.values()).sort((left, right) => left.sortOrder - right.sortOrder);
}

export function mergeSiteData(
  settings: SiteSettingsRecord | null,
  blocks: ContentBlockRecord[],
  timeline: TimelineMilestoneRecord[],
  adminEmails: AdminEmailRecord[],
  judgeEmails: JudgeEmailRecord[] = []
): SiteData {
  const mergedAdmins = new Map<string, AdminEmailRecord>();
  for (const entry of [...defaultAdminEmails, ...adminEmails]) {
    mergedAdmins.set(normalizeEmail(entry.email), entry);
  }
  const mergedJudges = new Map<string, JudgeEmailRecord>();
  for (const entry of judgeEmails) {
    mergedJudges.set(normalizeEmail(entry.email), entry);
  }

  return {
    settings: mergeSiteSettings(settings),
    blocks: mergeBlocks(defaultBlocks, blocks),
    timeline: mergeCollection(defaultTimeline, timeline),
    adminEmails: Array.from(mergedAdmins.values()).sort((left, right) =>
      left.email.localeCompare(right.email)
    ),
    judgeEmails: Array.from(mergedJudges.values()).sort((left, right) =>
      left.email.localeCompare(right.email)
    ),
  };
}
