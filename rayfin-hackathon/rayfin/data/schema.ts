import { AdminEmail } from './AdminEmail.js';
import { ContentBlock } from './ContentBlock.js';
import { FinalProjectSubmission } from './FinalProjectSubmission.js';
import { JudgeAssignment } from './JudgeAssignment.js';
import { JudgeEmail } from './JudgeEmail.js';
import { JudgingEntry } from './JudgingEntry.js';
import { ProjectSubmission } from './ProjectSubmission.js';
import { SiteSettings } from './SiteSettings.js';
import { TimelineMilestone } from './TimelineMilestone.js';

export type AppSchema = {
  AdminEmail: AdminEmail;
  ContentBlock: ContentBlock;
  FinalProjectSubmission: FinalProjectSubmission;
  JudgeAssignment: JudgeAssignment;
  JudgeEmail: JudgeEmail;
  JudgingEntry: JudgingEntry;
  ProjectSubmission: ProjectSubmission;
  SiteSettings: SiteSettings;
  TimelineMilestone: TimelineMilestone;
};

export const schema = [
  AdminEmail,
  ContentBlock,
  FinalProjectSubmission,
  JudgeAssignment,
  JudgeEmail,
  JudgingEntry,
  ProjectSubmission,
  SiteSettings,
  TimelineMilestone,
];
