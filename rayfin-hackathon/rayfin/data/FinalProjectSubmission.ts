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
export class FinalProjectSubmission {
  @uuid() id!: string;
  @text({ max: 200 }) ownerUserId!: string;
  @text({ max: 200 }) ownerEmail!: string;
  @text({ max: 200 }) submitterName!: string;
  @text({ max: 160 }) teamName!: string;
  @text({ max: 800 }) teamMembers!: string;
  @text({ max: 1200 }) projectSummary!: string;
  @text({ max: 2000 }) assetLinks!: string;
  @text({ max: 2000 }) feedbackNotes!: string;
  @text({ max: 40 }) createdAt!: string;
  @text({ max: 40 }) updatedAt!: string;
}
