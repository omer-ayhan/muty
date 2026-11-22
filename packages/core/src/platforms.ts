export const PLATFORM_IDS = ['youtube', 'linkedin', 'twitter'] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export interface PlatformInfo {
  id: PlatformId;
  label: string;
}

export const PLATFORM_CATALOG: readonly PlatformInfo[] = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'Twitter' },
];

export function isPlatformId(value: string): value is PlatformId {
  switch (value) {
    case 'youtube':
    case 'linkedin':
    case 'twitter':
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
      return 'Twitter';
    default: {
      const unknown: never = id;
      return unknown;
    }
  }
}
