import {
  authenticated,
  boolean,
  entity,
  int,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@authenticated('*')
export class ContentBlock {
  @uuid() id!: string;
  @text({ max: 40 }) pageKey!: string;
  @text({ max: 40 }) blockKind!: string;
  @text({ max: 200 }) title!: string;
  @text({ max: 4000 }) body!: string;
  @text({ max: 500, optional: true }) imageUrl?: string;
  @text({ max: 120, optional: true }) ctaLabel?: string;
  @text({ max: 2048, optional: true }) ctaUrl?: string;
  @boolean({ optional: true }) isHidden?: boolean;
  @int() sortOrder!: number;
}
