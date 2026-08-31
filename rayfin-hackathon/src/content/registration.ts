export const registrationOpenLabel = 'Registration is open';

const registrationOpenTime = 0;

export function isRegistrationOpen(now: Date = new Date()): boolean {
  return now.getTime() >= registrationOpenTime;
}
