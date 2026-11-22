import { PLATFORM_CATALOG, type PlatformAdapter, type PlatformId } from '@spoiler-mute/core';
import { createLinkedInAdapter } from './linkedin/index.ts';
import { createTwitterAdapter } from './twitter/index.ts';
import { createYouTubeAdapter } from './youtube/index.ts';

const byId: Record<PlatformId, PlatformAdapter> = {
  youtube: createYouTubeAdapter(),
  linkedin: createLinkedInAdapter(),
  twitter: createTwitterAdapter(),
};

export const adapters: readonly PlatformAdapter[] = PLATFORM_CATALOG.map((item) => byId[item.id]);

export function adapterFor(url: string): PlatformAdapter | null {
  return adapters.find((adapter) => adapter.testUrl(url)) ?? null;
}

export { createLinkedInAdapter } from './linkedin/index.ts';
export { createTwitterAdapter } from './twitter/index.ts';
export { createYouTubeAdapter } from './youtube/index.ts';
