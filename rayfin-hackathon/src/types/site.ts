export const DEFAULT_ADMIN_EMAIL = 'mgolestaneh@microsoft.com';

export type PageKey = 'home' | 'build' | 'judging' | 'submit' | 'resources';
export type BlockKind =
  | 'goal'
  | 'idea'
  | 'criterion'
  | 'reward'
  | 'submission'
  | 'resource'
  | 'recording'
  | 'upcomingSession'
  | 'resourceLibrarySection'
  | 'resourceRecordingsSection'
  | 'resourceUpcomingSessionsSection';

export interface SiteSettingsRecord {
  id: string;
  siteTitle: string;
  siteDescription: string;
  navBuildLabel: string;
  navJudgingLabel: string;
  navSubmitLabel: string;
  navProjectsLabel: string;
  heroBadge: string;
  bannerTitle: string;
  bannerDescription: string;
  bannerImageUrl: string;
  registerUrl: string;
  homeIntroTitle: string;
  homeIntroBody: string;
  homeExploreTitle: string;
  homeExploreBuildDescription: string;
  homeExploreJudgingDescription: string;
  homeExploreSubmitDescription: string;
  homeExploreProjectsDescription: string;
  homeGoalsTitle: string;
  homeTimelineTitle: string;
  buildHeroTitle: string;
  buildIdeasEyebrow: string;
  buildIdeasTitle: string;
  judgingHeroTitle: string;
  judgingCriteriaEyebrow: string;
  judgingCriteriaTitle: string;
  judgingFormPublished: boolean;
  registrationOpen: boolean;
  submissionOpen: boolean;
  resultsPublished: boolean;
  honorableMentionSubmissionIds: string;
  submitHeroTitle: string;
  submitChecklistEyebrow: string;
  submitChecklistTitle: string;
  submitDeadline: string;
  buildIntro: string;
  judgingIntro: string;
  submitIntro: string;
}

export interface ContentBlockRecord {
  id: string;
  pageKey: PageKey;
  blockKind: BlockKind;
  title: string;
  body: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  isHidden?: boolean;
  sortOrder: number;
}

export interface TimelineMilestoneRecord {
  id: string;
  dateLabel: string;
  milestone: string;
  description: string;
  sortOrder: number;
}

export interface AdminEmailRecord {
  id: string;
  email: string;
  addedByEmail: string;
}

export interface JudgeEmailRecord {
  id: string;
  email: string;
  addedByEmail: string;
}

export interface SiteData {
  settings: SiteSettingsRecord;
  blocks: ContentBlockRecord[];
  timeline: TimelineMilestoneRecord[];
  adminEmails: AdminEmailRecord[];
  judgeEmails: JudgeEmailRecord[];
}

export interface PersistedSiteState {
  hasSettings: boolean;
  blockIds: string[];
  timelineIds: string[];
  adminIds: string[];
  judgeIds: string[];
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
