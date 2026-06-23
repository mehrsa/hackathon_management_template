import { beforeEach, describe, expect, it, vi } from 'vitest';

const rayfinClientConstructor = vi.fn((options: unknown) => ({
  auth: {},
  options,
}));

vi.mock('@microsoft/rayfin-client', () => ({
  RayfinClient: rayfinClientConstructor,
}));

describe('initRayfinClient', () => {
  beforeEach(() => {
    vi.resetModules();
    rayfinClientConstructor.mockClear();
  });

  it('reuses the existing client when initialized with the same config', async () => {
    const { initRayfinClient } = await import('@/services/rayfinClient');
    const config = {
      baseUrl: 'https://example.com/',
      publishableKey: 'pk-test',
      localDev: false,
    };

    const firstClient = initRayfinClient(config);
    const secondClient = initRayfinClient(config);

    expect(secondClient).toBe(firstClient);
    expect(rayfinClientConstructor).toHaveBeenCalledTimes(1);
  });

  it('rejects reinitialization with a different config', async () => {
    const { initRayfinClient } = await import('@/services/rayfinClient');

    initRayfinClient({
      baseUrl: 'https://example.com/',
      publishableKey: 'pk-test',
      localDev: false,
    });

    expect(() =>
      initRayfinClient({
        baseUrl: 'https://another.example.com/',
        publishableKey: 'pk-test',
        localDev: false,
      })
    ).toThrowError(
      'Rayfin client is already initialized with different configuration.'
    );
  });
});
