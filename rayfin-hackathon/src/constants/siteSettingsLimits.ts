import type { SiteSettingsRecord } from '@/types/site';

export const SITE_SETTINGS_LIMITS: Record<
  Exclude<
    keyof SiteSettingsRecord,
    'id' | 'judgingFormPublished' | 'registrationOpen' | 'submissionOpen' | 'resultsPublished'
  >,
  number
> = {
  siteTitle: 120,
  siteDescription: 300,
  navBuildLabel: 120,
  navJudgingLabel: 120,
  navSubmitLabel: 120,
  navProjectsLabel: 120,
  heroBadge: 120,
  bannerTitle: 160,
  bannerDescription: 1000,
  bannerImageUrl: 500,
  registerUrl: 500,
  homeIntroTitle: 160,
  homeIntroBody: 1200,
  homeExploreTitle: 160,
  homeExploreBuildDescription: 300,
  homeExploreJudgingDescription: 300,
  homeExploreSubmitDescription: 300,
  homeExploreProjectsDescription: 300,
  homeGoalsTitle: 160,
  homeTimelineTitle: 200,
  buildHeroTitle: 200,
  buildIdeasEyebrow: 120,
  buildIdeasTitle: 160,
  judgingHeroTitle: 200,
  judgingCriteriaEyebrow: 120,
  judgingCriteriaTitle: 160,
  honorableMentionSubmissionIds: 4000,
  submitHeroTitle: 200,
  submitChecklistEyebrow: 120,
  submitChecklistTitle: 160,
  submitDeadline: 40,
  buildIntro: 1200,
  judgingIntro: 1200,
  submitIntro: 1200,
};
