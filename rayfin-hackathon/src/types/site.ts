export const DEFAULT_ADMIN_EMAIL = 'mgolestaneh@microsoft.com';

export type PageKey = 'home' | 'build' | 'judging' | 'submit';
export type BlockKind = 'goal' | 'idea' | 'criterion' | 'submission';

export interface SiteSettingsRecord {
  id: string;
  siteTitle: string;
  siteDescription: string;
  navBuildLabel: string;
  navJudgingLabel: string;
  navSubmitLabel: string;
  heroBadge: string;
  bannerTitle: string;
  bannerDescription: string;
  bannerImageUrl: string;
  registerUrl: string;
  homeIntroTitle: string;
  homeIntroBody: string;
  homeExploreTitle: string;
  homeGoalsTitle: string;
  homeTimelineTitle: string;
  buildHeroTitle: string;
  buildIdeasEyebrow: string;
  buildIdeasTitle: string;
  judgingHeroTitle: string;
  judgingCriteriaEyebrow: string;
  judgingCriteriaTitle: string;
  submitHeroTitle: string;
  submitChecklistEyebrow: string;
  submitChecklistTitle: string;
  submitReminderTitle: string;
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

export interface SiteData {
  settings: SiteSettingsRecord;
  blocks: ContentBlockRecord[];
  timeline: TimelineMilestoneRecord[];
  adminEmails: AdminEmailRecord[];
}

export interface PersistedSiteState {
  hasSettings: boolean;
  blockIds: string[];
  timelineIds: string[];
  adminIds: string[];
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
