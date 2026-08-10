import {
  authenticated,
  boolean,
  entity,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@authenticated('*')
export class SiteSettings {
  @uuid() id!: string;
  @text({ max: 120 }) siteTitle!: string;
  @text({ max: 300 }) siteDescription!: string;
  @text({ max: 120, optional: true }) navBuildLabel?: string;
  @text({ max: 120, optional: true }) navJudgingLabel?: string;
  @text({ max: 120, optional: true }) navSubmitLabel?: string;
  @text({ max: 120, optional: true }) navProjectsLabel?: string;
  @text({ max: 120 }) heroBadge!: string;
  @text({ max: 160 }) bannerTitle!: string;
  @text({ max: 1000 }) bannerDescription!: string;
  @text({ max: 500 }) bannerImageUrl!: string;
  @text({ max: 500 }) registerUrl!: string;
  @text({ max: 160, optional: true }) homeIntroTitle?: string;
  @text({ max: 1200, optional: true }) homeIntroBody?: string;
  @text({ max: 160, optional: true }) homeExploreTitle?: string;
  @text({ max: 300, optional: true }) homeExploreBuildDescription?: string;
  @text({ max: 300, optional: true }) homeExploreJudgingDescription?: string;
  @text({ max: 300, optional: true }) homeExploreSubmitDescription?: string;
  @text({ max: 300, optional: true }) homeExploreProjectsDescription?: string;
  @text({ max: 160, optional: true }) homeGoalsTitle?: string;
  @text({ max: 200, optional: true }) homeTimelineTitle?: string;
  @text({ max: 200, optional: true }) buildHeroTitle?: string;
  @text({ max: 120, optional: true }) buildIdeasEyebrow?: string;
  @text({ max: 160, optional: true }) buildIdeasTitle?: string;
  @text({ max: 200, optional: true }) judgingHeroTitle?: string;
  @text({ max: 120, optional: true }) judgingCriteriaEyebrow?: string;
  @text({ max: 160, optional: true }) judgingCriteriaTitle?: string;
  @boolean({ optional: true }) judgingFormPublished?: boolean;
  @text({ max: 200, optional: true }) submitHeroTitle?: string;
  @text({ max: 120, optional: true }) submitChecklistEyebrow?: string;
  @text({ max: 160, optional: true }) submitChecklistTitle?: string;
  @text({ max: 40, optional: true }) submitDeadline?: string;
  @text({ max: 1200 }) buildIntro!: string;
  @text({ max: 1200 }) judgingIntro!: string;
  @text({ max: 1200 }) submitIntro!: string;
}
