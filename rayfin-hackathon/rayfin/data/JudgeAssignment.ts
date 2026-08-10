import {
  authenticated,
  entity,
  int,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@authenticated('read')
@authenticated(['create', 'delete'], {
  policy: (claims, item) => claims.sub.eq(item.judgeUserId),
})
export class JudgeAssignment {
  @uuid() id!: string;
  @uuid() submissionId!: string;
  @int() slot!: number;
  @text({ max: 200 }) judgeUserId!: string;
  @text({ max: 40 }) createdAt!: string;
}
