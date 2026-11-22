export interface CompiledPhrase {
  phrase: string;
  re: RegExp;
}

export function normalizePhrase(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[_\s/-]+/g, ' ')
    .replace(/^[\s"'“”‘’.,!?;:()[\]{}]+|[\s"'“”‘’.,!?;:()[\]{}]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function endPattern(token: string): string {
  const chars = [...token];
  const lastChar = chars[chars.length - 1] ?? '';
  if (/^\p{N}$/u.test(lastChar)) return '(?!\\p{N})';
  if (/^\p{L}$/u.test(lastChar)) return chars.length <= 3 ? '(?!\\p{L})' : '';
  return '(?![\\p{L}\\p{N}])';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function compilePhrase(phrase: string): CompiledPhrase | null {
  const cleaned = normalizePhrase(phrase);
  if (!cleaned) return null;
  const tokens = cleaned.split(' ');
  const body = tokens.map(escapeRegExp).join('[^\\p{L}\\p{N}]*');
  const end = endPattern(tokens[tokens.length - 1] ?? '');
  return {
    phrase: cleaned,
    re: new RegExp(`(?:^|[^\\p{L}\\p{N}])${body}${end}`, 'iu'),
  };
}

export function findMatch(text: string, keywords: readonly (string | CompiledPhrase)[]): string | null {
  if (!text || keywords.length === 0) return null;
  const hay = String(text).normalize('NFKC');
  for (const keyword of keywords) {
    const compiled = typeof keyword === 'string' ? compilePhrase(keyword) : keyword;
    if (compiled?.re.test(hay)) return compiled.phrase;
  }
  return null;
}
