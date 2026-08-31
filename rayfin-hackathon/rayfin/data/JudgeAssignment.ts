import {
  authenticated,
  entity,
  int,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@authenticated('read')
@authenticated(['create', 'delete'])
export class JudgeAssignment {
  @uuid() id!: string;
  @uuid() submissionId!: string;
  @int() slot!: number;
  @text({ max: 200 }) judgeUserId!: string;
  @text({ max: 200, optional: true }) judgeName?: string;
  @text({ max: 200, optional: true }) judgeEmail?: string;
  @text({ max: 40 }) createdAt!: string;
}
