import { RayfinClient } from '@microsoft/rayfin-client';

import type { AppSchema } from '../../rayfin/data/schema';

export interface RayfinClientConfig {
  baseUrl: string;
  publishableKey: string;
  /** True when the API URL points at localhost. Exposed via {@link isLocalBackend}. */
  localDev: boolean;
}

let client: RayfinClient<AppSchema> | null = null;
let clientConfig: RayfinClientConfig | null = null;
let localDev = false;

export function initRayfinClient(
  config: RayfinClientConfig
): RayfinClient<AppSchema> {
  if (client) {
    if (
      clientConfig?.baseUrl !== config.baseUrl ||
      clientConfig.publishableKey !== config.publishableKey ||
      clientConfig.localDev !== config.localDev
    ) {
      throw new Error(
        'Rayfin client is already initialized with different configuration.'
      );
    }
    return client;
  }
  client = new RayfinClient<AppSchema>({
    baseUrl: config.baseUrl,
    publishableKey: config.publishableKey,
    useProxy: false,
    authStorage: true,
  });
  clientConfig = config;
  localDev = config.localDev;
  return client;
}

export function getRayfinClient(): RayfinClient<AppSchema> {
  if (!client) {
    throw new Error(
      'Rayfin client not initialized. Call bootstrapAuth() first.'
    );
  }
  return client;
}

/** True when the app was bootstrapped against a localhost backend. */
export function isLocalBackend(): boolean {
  return localDev;
}
