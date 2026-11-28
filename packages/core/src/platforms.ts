export const PLATFORM_IDS = ['youtube', 'linkedin', 'twitter', 'kick', 'twitch', 'reddit'] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export interface PlatformInfo {
  id: PlatformId;
  label: string;
}

export const PLATFORM_CATALOG: readonly PlatformInfo[] = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'X' },
  { id: 'kick', label: 'Kick' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'reddit', label: 'Reddit' },
];

export function isPlatformId(value: string): value is PlatformId {
  switch (value) {
    case 'youtube':
    case 'linkedin':
    case 'twitter':
    case 'kick':
    case 'twitch':
    case 'reddit':
      return true;
    default:
      return false;
  }
}

export function platformLabel(id: PlatformId): string {
  switch (id) {
    case 'youtube':
      return 'YouTube';
    case 'linkedin':
      return 'LinkedIn';
    case 'twitter':
      return 'X';
    case 'kick':
      return 'Kick';
    case 'twitch':
      return 'Twitch';
    case 'reddit':
      return 'Reddit';
    default: {
      const unknown: never = id;
      return unknown;
    }
  }
}
