import {
  authenticated,
  entity,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@authenticated('*')
export class ResultProjectDescription {
  @uuid() id!: string;
  @text({ max: 200 }) submissionId!: string;
  @text({ max: 160, optional: true }) projectTitle?: string;
  @text({ max: 1200 }) description!: string;
  @text({ max: 2000, optional: true }) projectLinks?: string;
  @text({ max: 40 }) updatedAt!: string;
}
