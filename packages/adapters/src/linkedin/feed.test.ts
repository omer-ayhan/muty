import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFeed, normalizeSettings } from '@muty/core';
import { parseHTML } from 'linkedom';
import { createLinkedInAdapter } from './index.ts';

const settings = normalizeSettings({ keywords: ['gta 6'] });

test('a LinkedIn update hides when the commentary matches', () => {
  const { document } = parseHTML(`
    <div>
      <div class="feed-shared-update-v2" id="bad">
        <span class="update-components-actor__name">Game News</span>
        <div class="update-components-text">The GTA 6 trailer just dropped</div>
      </div>
      <div class="feed-shared-update-v2" id="ok">
        <div class="update-components-text">Sourdough in a cold kitchen</div>
      </div>
    </div>
  `);
  applyFeed(document, createLinkedInAdapter(), settings, {});
  assert.equal(document.querySelector('#bad')?.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#ok')?.classList.contains('muty-hidden'), false);
});

test('a new LinkedIn feed card hides from the post text', () => {
  const { document } = parseHTML(`
    <div data-testid="mainFeed" role="list">
      <div role="listitem" id="bad">
        <a href="/in/gta-daily">GTA 6 Daily</a>
        <div data-testid="expandable-text-box">The GTA 6 trailer just dropped</div>
      </div>
      <div role="listitem" id="ok">
        <div data-testid="expandable-text-box">Sourdough in a cold kitchen</div>
      </div>
    </div>
  `);
  applyFeed(document, createLinkedInAdapter(), settings, {});
  assert.equal(document.querySelector('#bad')?.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#ok')?.classList.contains('muty-hidden'), false);
  const hidden = document.querySelector('#bad') as HTMLElement | null;
  assert.equal(hidden?.style.getPropertyValue('display'), 'none');
});

test('a LinkedIn search result hides when the row contains the phrase', () => {
  const { document } = parseHTML(`
    <div>
      <nav>
        <div role="list"><div role="listitem" id="nav">GTA 6</div></div>
      </nav>
      <main>
        <div role="list">
          <div role="listitem" id="post">
            <div data-testid="expandable-text-box">The GTA 6 trailer just dropped</div>
          </div>
          <div role="listitem" id="person">
            <a href="/in/gta-daily">GTA 6 Daily</a>
            <p>Game industry</p>
          </div>
          <div role="listitem" id="ok">
            <p>Hiring a baker</p>
          </div>
        </div>
      </main>
    </div>
  `);
  applyFeed(document, createLinkedInAdapter(), settings, {});
  assert.equal(document.querySelector('#post')?.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#person')?.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#ok')?.classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#nav')?.classList.contains('muty-hidden'), false);
});
