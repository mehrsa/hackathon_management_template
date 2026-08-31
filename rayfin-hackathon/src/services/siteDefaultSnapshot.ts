import { defaultSiteData, mergeSiteData } from '@/content/defaultContent';
import type { SiteData } from '@/types/site';

const siteDefaultSnapshotStorageKey = 'rayfin-site-content-defaults-v1';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readSiteDefaultSnapshot(): SiteData | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const rawSnapshot = window.localStorage.getItem(siteDefaultSnapshotStorageKey);
  if (!rawSnapshot) {
    return null;
  }

  try {
    const parsedSnapshot = JSON.parse(rawSnapshot) as Partial<SiteData>;
    return mergeSiteData(
      parsedSnapshot.settings ?? null,
      parsedSnapshot.blocks ?? [],
      parsedSnapshot.timeline ?? [],
      parsedSnapshot.adminEmails ?? [],
      parsedSnapshot.judgeEmails ?? []
    );
  } catch {
    window.localStorage.removeItem(siteDefaultSnapshotStorageKey);
    return null;
  }
}

export function writeSiteDefaultSnapshot(siteData: SiteData) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(siteDefaultSnapshotStorageKey, JSON.stringify(siteData));
}

export function getRuntimeDefaultSiteData(): SiteData {
  return readSiteDefaultSnapshot() ?? defaultSiteData;
}
