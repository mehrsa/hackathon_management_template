import {
  authenticated,
  entity,
  int,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@authenticated('*')
export class TimelineMilestone {
  @uuid() id!: string;
  @text({ max: 80 }) dateLabel!: string;
  @text({ max: 160 }) milestone!: string;
  @text({ max: 600 }) description!: string;
  @int() sortOrder!: number;
}
