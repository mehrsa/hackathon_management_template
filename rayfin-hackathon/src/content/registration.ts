export const registrationOpenLabel = 'Registration Opens on July 1st 2026';

const registrationOpenTime = new Date(2026, 6, 1).getTime();

export function isRegistrationOpen(now: Date = new Date()): boolean {
  return now.getTime() >= registrationOpenTime;
}
