import {
  authenticated,
  entity,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@authenticated('read')
@authenticated(['create', 'update', 'delete'], {
  policy: (claims, item) => claims.sub.eq(item.ownerUserId),
})
export class ProjectSubmission {
  @uuid() id!: string;
  @text({ max: 200 }) ownerUserId!: string;
  @text({ max: 200 }) ownerEmail!: string;
  @text({ max: 200 }) submitterName!: string;
  @text({ max: 160 }) projectTitle!: string;
  @text({ max: 600 }) teamMembers!: string;
  @text({ max: 600 }) teamEmails!: string;
  @text({ max: 2000 }) appTheme!: string;
  @text({ max: 2000 }) teamRoles!: string;
  @text({ max: 40 }) createdAt!: string;
  @text({ max: 40 }) updatedAt!: string;
}
