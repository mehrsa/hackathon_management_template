import {
  authenticated,
  boolean,
  entity,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@authenticated(['create', 'read', 'update', 'delete'], {
  policy: (claims, item) => claims.sub.eq(item.judgeUserId),
})
export class JudgingEntry {
  @uuid() id!: string;
  @uuid() submissionId!: string;
  @text({ max: 200 }) judgeUserId!: string;
  @text({ max: 200 }) judgeEmail!: string;
  @text({ max: 4000 }) scoresJson!: string;
  @text({ max: 4000, optional: true }) notes?: string;
  @boolean() starred!: boolean;
  @text({ max: 40 }) createdAt!: string;
  @text({ max: 40 }) updatedAt!: string;
}
