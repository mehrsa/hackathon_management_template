import { AdminEmail } from './AdminEmail.js';
import { ContentBlock } from './ContentBlock.js';
import { SiteSettings } from './SiteSettings.js';
import { TimelineMilestone } from './TimelineMilestone.js';

export type AppSchema = {
  AdminEmail: AdminEmail;
  ContentBlock: ContentBlock;
  SiteSettings: SiteSettings;
  TimelineMilestone: TimelineMilestone;
};

export const schema = [AdminEmail, ContentBlock, SiteSettings, TimelineMilestone];
