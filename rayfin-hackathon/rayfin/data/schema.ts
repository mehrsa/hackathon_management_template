import { AdminEmail } from './AdminEmail.js';
import { ContentBlock } from './ContentBlock.js';
import { FinalProjectSubmission } from './FinalProjectSubmission.js';
import { ProjectSubmission } from './ProjectSubmission.js';
import { SiteSettings } from './SiteSettings.js';
import { TimelineMilestone } from './TimelineMilestone.js';

export type AppSchema = {
  AdminEmail: AdminEmail;
  ContentBlock: ContentBlock;
  FinalProjectSubmission: FinalProjectSubmission;
  ProjectSubmission: ProjectSubmission;
  SiteSettings: SiteSettings;
  TimelineMilestone: TimelineMilestone;
};

export const schema = [
  AdminEmail,
  ContentBlock,
  FinalProjectSubmission,
  ProjectSubmission,
  SiteSettings,
  TimelineMilestone,
];
