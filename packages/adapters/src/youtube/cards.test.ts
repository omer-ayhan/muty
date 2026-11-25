// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFeed, normalizeSettings, type Settings } from '@muty/core';
import { parseHTML } from 'linkedom';
import { createYouTubeAdapter } from './index.ts';

const youtube = createYouTubeAdapter();

function settings(overrides: Partial<Settings> = {}): Settings {
  return normalizeSettings({
    keywords: ['gta 6', 'gta vi', 'grand theft auto 6', 'grand theft auto vi'],
    ...overrides,
  });
}

function run(document: ParentNode, next: Settings, options: { forceShow?: boolean } = {}) {
  return applyFeed(document, youtube, next, options);
}

const markup = `
  <div id="feed">
    <ytd-rich-item-renderer id="spoiler">
      <yt-lockup-view-model id="inner-lockup">
        <a class="ytLockupMetadataViewModelTitle" href="/watch?v=aaa">GTA 6 ending explained</a>
        <div class="ytContentMetadataViewModelMetadataRow"><a href="/@news">GameNews</a></div>
      </yt-lockup-view-model>
    </ytd-rich-item-renderer>
    <ytd-rich-item-renderer id="safe">
      <a class="ytLockupMetadataViewModelTitle">Sourdough in a cold kitchen</a>
    </ytd-rich-item-renderer>
    <ytd-rich-item-renderer id="gta5">
      <a id="video-title">I replayed GTA 5</a>
    </ytd-rich-item-renderer>
    <ytd-video-renderer id="joined">
      <a id="video-title" href="/watch?v=bbb">GTA6 map, fully walked</a>
    </ytd-video-renderer>
    <ytd-rich-item-renderer id="essay">
      <a id="video-title">The GTA video essay</a>
    </ytd-rich-item-renderer>
    <ytd-video-renderer id="described">
      <a id="video-title">Saturday market</a>
      <div id="description-text">We somehow got onto GTA 6</div>
    </ytd-video-renderer>
    <ytd-rich-item-renderer id="channel-card">
      <a id="video-title">You will not believe this</a>
      <ytd-channel-name><a>GTA 6 Daily</a></ytd-channel-name>
    </ytd-rich-item-renderer>
    <ytd-rich-shelf-renderer id="mixed-shelf">
      <ytm-shorts-lockup-view-model id="short-bad">
        <h3 class="shortsLockupViewModelHostMetadataTitle">GTA VI in 20 seconds</h3>
      </ytm-shorts-lockup-view-model>
      <ytm-shorts-lockup-view-model id="short-ok">
        <h3 class="shortsLockupViewModelHostMetadataTitle">Rain on the window</h3>
      </ytm-shorts-lockup-view-model>
    </ytd-rich-shelf-renderer>
    <ytd-rich-shelf-renderer id="bad-shelf">
      <ytd-rich-item-renderer id="bad-1"><a id="video-title">grand theft auto 6 secrets</a></ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="bad-2"><a id="video-title">GTA-6 map size</a></ytd-rich-item-renderer>
    </ytd-rich-shelf-renderer>
    <ytd-backstage-post-renderer id="post">
      <yt-formatted-string id="content-text">Just watched the GTA 6 ending</yt-formatted-string>
    </ytd-backstage-post-renderer>
    <div class="muty-ui">
      <ytd-rich-item-renderer id="exempt">
        <a id="video-title">GTA 6 inside the extension UI</a>
      </ytd-rich-item-renderer>
    </div>
    <ytd-reel-video-renderer id="playing-short">
      <yt-lockup-view-model id="playing-lockup">
        <a class="ytLockupMetadataViewModelTitle">GTA 6 short that is playing</a>
      </yt-lockup-view-model>
    </ytd-reel-video-renderer>
  </div>
`;


async function feed() {
  return parseHTML(markup).document;
}

test('lockup cards hide the outer grid item', async () => {
  const document = await feed();
  const result = run(document, settings(), {});
  const spoiler = document.querySelector('#spoiler');
  assert.equal(spoiler.classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#inner-lockup').classList.contains('muty-hidden'), false);
  assert.equal(spoiler.getAttribute('data-sm-phrase'), 'gta 6');
  assert.equal(document.querySelector('#safe').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#gta5').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#essay').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#joined').classList.contains('muty-hidden'), true);
  assert.ok(result.hidden >= 5);
});

test('the end screen hides a matching tile and leaves GTA IV', async () => {
  const { parseHTML } = await import('linkedom');
  const { document } = parseHTML(`
    <div class="html5-endscreen">
      <a class="ytp-videowall-still" id="end-gta6" href="/watch?v=end6">
        <span class="ytp-videowall-still-info-title">How GTA 6 Reinvented Vice City?</span>
        <span class="ytp-videowall-still-info-author">TheGameEssayist</span>
      </a>
      <a class="ytp-videowall-still" id="end-gta4" href="/watch?v=end4">
        <span class="ytp-videowall-still-info-title">The coldest moment in any Grand Theft Auto game - GTA IV</span>
      </a>
      <div class="ytp-ce-element ytp-ce-video" id="end-card">
        <div class="ytp-ce-video-title">GTA VI trailer breakdown</div>
      </div>
    </div>
  `);
  run(document, settings(), {});
  assert.equal(document.querySelector('#end-gta6').classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#end-gta4').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#end-card').classList.contains('muty-hidden'), true);
});

test('the fullscreen end grid hides a matching tile and leaves GTA IV', async () => {
  const { document } = parseHTML(`
    <div class="ytp-fullscreen-grid">
      <div class="ytp-fullscreen-grid-stills-container">
        <a class="ytp-modern-videowall-still ytp-suggestion-set" id="modern-gta6" href="/watch?v=m6">
          <span class="ytp-modern-videowall-still-info">
            <span class="ytp-modern-videowall-still-info-title">GTA 6 Crazy Insane APC TANK RAMPAGE!</span>
            <span class="ytp-modern-videowall-still-info-author">Badass Villain</span>
          </span>
        </a>
        <a class="ytp-modern-videowall-still ytp-suggestion-set" id="modern-gta4" href="/watch?v=m4">
          <span class="ytp-modern-videowall-still-info-title">Gta IV random events</span>
        </a>
      </div>
    </div>
  `);
  run(document, settings(), {});
  assert.equal(document.querySelector('#modern-gta6').classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#modern-gta6').style.display, 'none');
  assert.equal(document.querySelector('#modern-gta4').classList.contains('muty-hidden'), false);
});

test('an end screen inside the player shadow hides GTA 6 and leaves GTA IV', async () => {
  const { parseHTML } = await import('linkedom');
  const { document } = parseHTML('<ytd-player id="player"></ytd-player>');
  const player = document.querySelector('#player');
  const shadow = player.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <a class="ytp-videowall-still" id="shadow-gta6" href="/watch?v=s6">
      <span class="ytp-videowall-still-info-title">GTA 6 is COLLAPSING</span>
    </a>
    <a class="ytp-videowall-still" id="shadow-gta4" href="/watch?v=s4">
      <span class="ytp-videowall-still-info-title">Michael Rosen Plays Grand Theft Auto 4</span>
    </a>
  `;
  run(document, settings(), {});
  assert.equal(shadow.querySelector('#shadow-gta6').classList.contains('muty-hidden'), true);
  assert.equal(shadow.querySelector('#shadow-gta6').style.display, 'none');
  assert.equal(shadow.querySelector('#shadow-gta4').classList.contains('muty-hidden'), false);
});

test('a description can hide a harmless title', async () => {
  const document = await feed();
  run(document, settings(), {});
  assert.equal(document.querySelector('#described').classList.contains('muty-hidden'), true);
});

test('channel names are ignored unless the setting is on', async () => {
  const document = await feed();
  run(document, settings(), {});
  assert.equal(document.querySelector('#channel-card').classList.contains('muty-hidden'), false);
  run(document, settings({ matchChannel: true }), {});
  assert.equal(document.querySelector('#channel-card').getAttribute('data-sm-phrase'), 'gta 6');
});

test('a mixed shelf stays and a fully matching shelf collapses', async () => {
  const document = await feed();
  run(document, settings(), {});
  assert.equal(document.querySelector('#short-bad').classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#short-ok').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#mixed-shelf').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#bad-shelf').classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#post').classList.contains('muty-hidden'), true);
});

test('empty shorts shelves and official cards collapse', async () => {
  const { parseHTML } = await import('linkedom');
  const { document } = parseHTML(`
    <div>
      <yt-official-card-view-model id="official">
        <h1 class="dynamicTextViewModelH1">Grand Theft Auto VI</h1>
        <yt-lockup-view-model id="inside-safe">
          <a class="ytLockupMetadataViewModelTitle">Piano in the kitchen</a>
        </yt-lockup-view-model>
      </yt-official-card-view-model>
      <yt-official-card-view-model id="emptied">
        <h1 class="dynamicTextViewModelH1">From the channel</h1>
        <yt-lockup-view-model id="only-bad">
          <a class="ytLockupMetadataViewModelTitle">GTA 6 trailer</a>
        </yt-lockup-view-model>
      </yt-official-card-view-model>
      <grid-shelf-view-model id="shorts-row">
        <h2>Shorts</h2>
        <ytm-shorts-lockup-view-model id="s1">
          <h3 class="shortsLockupViewModelHostMetadataTitle">GTA 6 clip</h3>
        </ytm-shorts-lockup-view-model>
        <ytm-shorts-lockup-view-model id="s2">
          <h3 class="shortsLockupViewModelHostMetadataTitle">GTA VI teaser</h3>
        </ytm-shorts-lockup-view-model>
      </grid-shelf-view-model>
      <grid-shelf-view-model id="mixed-row">
        <h2>Shorts</h2>
        <ytm-shorts-lockup-view-model id="s3">
          <h3 class="shortsLockupViewModelHostMetadataTitle">GTA 6 clip</h3>
        </ytm-shorts-lockup-view-model>
        <ytm-shorts-lockup-view-model id="s4">
          <h3 class="shortsLockupViewModelHostMetadataTitle">Rain on the window</h3>
        </ytm-shorts-lockup-view-model>
      </grid-shelf-view-model>
      <yt-official-card-view-model id="cooking">
        <h1 class="dynamicTextViewModelH1">Weeknight cooking</h1>
        <yt-lockup-view-model id="cook-bad">
          <a class="ytLockupMetadataViewModelTitle">GTA 6 ending</a>
        </yt-lockup-view-model>
        <yt-lockup-view-model id="cook-ok">
          <a class="ytLockupMetadataViewModelTitle">Soup</a>
        </yt-lockup-view-model>
      </yt-official-card-view-model>
      <ytd-channel-renderer id="channel">
        <ytd-channel-name><a id="text">Grand Theft Auto VI</a></ytd-channel-name>
      </ytd-channel-renderer>
    </div>
  `);
  run(document, settings(), {});
  assert.equal(document.querySelector('#official').classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#emptied').classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#shorts-row').classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#mixed-row').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#s4').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#cooking').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#cook-ok').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#channel').classList.contains('muty-hidden'), true);
  run(document, settings(), { forceShow: true });
  assert.equal(document.querySelector('#official').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#shorts-row').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#channel').classList.contains('muty-hidden'), false);
});

test('the extension UI and the playing Short are left alone', async () => {
  const document = await feed();
  run(document, settings(), {});
  assert.equal(document.querySelector('#exempt').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#playing-lockup').classList.contains('muty-hidden'), false);
});

test('showing hidden videos keeps the count and removes the hide class', async () => {
  const document = await feed();
  const shown = run(document, settings(), { forceShow: true });
  assert.equal(shown.hidden, 0);
  assert.ok(shown.matches >= 5);
  assert.equal(document.querySelector('#spoiler').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#bad-shelf').classList.contains('muty-hidden'), false);
});

test('turning filtering off clears an earlier hide', async () => {
  const document = await feed();
  run(document, settings(), {});
  const cleared = run(document, settings({ enabled: false }), {});
  assert.equal(cleared.hidden, 0);
  assert.equal(document.querySelector('#spoiler').classList.contains('muty-hidden'), false);
  assert.equal(document.querySelector('#bad-shelf').classList.contains('muty-hidden'), false);
});

test('an aria label uses the title and not the channel that follows', async () => {
  const { parseHTML } = await import('linkedom');
  const { document } = parseHTML(`
    <div>
      <ytd-rich-item-renderer id="aria-title">
        <a href="/watch?v=aaa" aria-label="GTA 6 ending by GameNews 1M views"></a>
      </ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="aria-channel">
        <a href="/watch?v=bbb" aria-label="Quiet bread recipe by GTA 6 Daily 10K views"></a>
      </ytd-rich-item-renderer>
    </div>
  `);
  run(document, settings(), {});
  assert.equal(document.querySelector('#aria-title').classList.contains('muty-hidden'), true);
  assert.equal(document.querySelector('#aria-channel').classList.contains('muty-hidden'), false);
});

test('a title inside an open shadow root still matches', async () => {
  const { parseHTML } = await import('linkedom');
  const { document } = parseHTML('<div id="root"><ytd-video-renderer id="host"></ytd-video-renderer></div>');
  const host = document.querySelector('#host');
  assert.equal(typeof host.attachShadow, 'function');
  const shadow = host.attachShadow({ mode: 'open' });
  const link = document.createElement('a');
  link.id = 'video-title';
  link.textContent = 'GTA 6 from the shadow root';
  shadow.append(link);
  const result = run(document, settings(), {});
  assert.equal(host.classList.contains('muty-hidden'), true);
  assert.equal(result.hidden, 1);
});
