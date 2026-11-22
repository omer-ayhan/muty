export function clean(value: string | null | undefined): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function textFrom(root: ParentNode, selectors: readonly string[]): string {
  for (const selector of selectors) {
    const node = root.querySelector(selector);
    const text = clean(node?.textContent);
    if (text) return text;
  }
  return '';
}

export function outermostMatches(root: ParentNode, selector: string): Element[] {
  const nodes = [...root.querySelectorAll(selector)];
  return nodes.filter((node) => !nodes.some((other) => other !== node && other.contains(node)));
}

export function textsFrom(root: ParentNode, selectors: readonly string[]): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const selector of selectors) {
    if (!selector) continue;
    for (const node of outermostMatches(root, selector)) {
      const text = clean(node.textContent);
      if (!text || seen.has(text)) continue;
      seen.add(text);
      parts.push(text);
    }
  }
  return parts.join('\n');
}
