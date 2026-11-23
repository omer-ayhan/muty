import { PLATFORM_CATALOG, type PlatformAdapter, type PlatformId } from '@spoiler-mute/core';
import { createKickAdapter } from './kick/index.ts';
import { createLinkedInAdapter } from './linkedin/index.ts';
import { createTwitchAdapter } from './twitch/index.ts';
import { createTwitterAdapter } from './twitter/index.ts';
import { createYouTubeAdapter } from './youtube/index.ts';

const byId: Record<PlatformId, PlatformAdapter> = {
  youtube: createYouTubeAdapter(),
  linkedin: createLinkedInAdapter(),
  twitter: createTwitterAdapter(),
  kick: createKickAdapter(),
  twitch: createTwitchAdapter(),
};

export const adapters: readonly PlatformAdapter[] = PLATFORM_CATALOG.map((item) => byId[item.id]);

export function adapterFor(url: string): PlatformAdapter | null {
  return adapters.find((adapter) => adapter.testUrl(url)) ?? null;
}

export { createKickAdapter } from './kick/index.ts';
export { createLinkedInAdapter } from './linkedin/index.ts';
export { createTwitchAdapter } from './twitch/index.ts';
export { createTwitterAdapter } from './twitter/index.ts';
export { createYouTubeAdapter } from './youtube/index.ts';
