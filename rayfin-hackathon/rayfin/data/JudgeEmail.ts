import { authenticated, entity, text, uuid } from '@microsoft/rayfin-core';

@entity()
@authenticated(['create', 'read', 'delete'])
export class JudgeEmail {
  @uuid() id!: string;
  @text({ max: 200 }) email!: string;
  @text({ max: 200 }) addedByEmail!: string;
}
