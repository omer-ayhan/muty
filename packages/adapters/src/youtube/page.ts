import { findMatch, type PageController, type PageScan } from "@muty/core";

const NEXT_SELECTORS = [
  "#navigation-button-down button",
  "ytd-shorts #navigation-button-down button",
  ".navigation-button-down button",
];

const WATCH_TITLE_SELECTORS = [
  "ytd-watch-metadata h1 yt-formatted-string",
  "ytd-watch-metadata #title yt-formatted-string",
  "h1.ytd-watch-metadata yt-formatted-string",
  "ytm-slim-video-information-renderer h2 .ytAttributedStringHost",
  "h2.slim-video-information-title",
  "ytd-watch-metadata h1",
];

const SHORTS_TITLE_SELECTORS = [
  "yt-shorts-video-title-view-model h2",
  "h2.ytShortsVideoTitleViewModelShortsVideoTitle",
  ".ytShortsVideoTitleViewModelShortsVideoTitle",
  "ytd-reel-video-renderer h2",
];

type PageKind = "watch" | "shorts" | "feed";

function pageKind(location: Location): PageKind {
  if (location.pathname === "/watch") return "watch";
  if (location.pathname.startsWith("/shorts/")) return "shorts";
  return "feed";
}

function mediaId(location: Location): string {
  if (location.pathname === "/watch")
    return new URL(location.href).searchParams.get("v") || "";
  if (location.pathname.startsWith("/shorts/")) {
    const [, , id] = location.pathname.split("/");
    return id || "";
  }
  return "";
}

function allowKey(id: string): string {
  return `muty-allow:${id}`;
}

function readFirst(document: Document, selectors: readonly string[]): string {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const text = el ? (el.textContent ?? "").replace(/\s+/g, " ").trim() : "";
    if (text) return text;
  }
  return "";
}

function titleFromDocument(document: Document, location: Location): string {
  const kind = pageKind(location);
  if (kind === "watch")
    return (
      readFirst(document, WATCH_TITLE_SELECTORS) || fallbackTitle(document)
    );
  if (kind === "shorts")
    return (
      readFirst(document, SHORTS_TITLE_SELECTORS) || fallbackTitle(document)
    );
  return "";
}

function fallbackTitle(document: Document): string {
  return document.title.replace(/\s+[-|]\s+YouTube\s*$/i, "").trim();
}

function isVideo(target: EventTarget | null): target is HTMLVideoElement {
  return Boolean(
    target && "pause" in target && typeof target.pause === "function",
  );
}

export function createYouTubePage(): PageController {
  let cover: HTMLElement | null = null;
  let coverPhrase = "";
  let shortsSkipStreak = 0;
  let lastSkippedId = "";
  let skipTimer = 0;
  let scanNow: (() => void) | null = null;
  let watchedPlayer: ShadowRoot | null = null;
  let playerWatch: MutationObserver | null = null;

  function watchPlayer(document: Document): void {
    const shadow = document.querySelector("ytd-player")?.shadowRoot ?? null;
    if (!shadow || shadow === watchedPlayer) return;
    watchedPlayer = shadow;
    playerWatch?.disconnect();
    playerWatch = new MutationObserver(() => {
      scanNow?.();
    });
    playerWatch.observe(shadow, { childList: true, subtree: true });
  }

  function isAllowed(id: string): boolean {
    if (!id) return false;
    try {
      return sessionStorage.getItem(allowKey(id)) === "1";
    } catch {
      return false;
    }
  }

  function allowCurrent(location: Location): void {
    const id = mediaId(location);
    if (!id) return;
    try {
      sessionStorage.setItem(allowKey(id), "1");
    } catch {
      /* private mode can block storage; the cover still closes for this scan */
    }
  }

  function removeCover(): void {
    coverPhrase = "";
    cover?.remove();
    cover = null;
  }

  function pauseVideos(document: Document): void {
    for (const video of document.querySelectorAll("video")) {
      if (isVideo(video)) video.pause();
    }
  }

  function clickNext(document: Document): boolean {
    for (const selector of NEXT_SELECTORS) {
      const button = document.querySelector(selector);
      if (!button) continue;
      if ("disabled" in button && button.disabled) continue;
      if (button.getAttribute("aria-disabled") === "true") continue;
      if (button instanceof HTMLElement) button.click();
      return true;
    }
    return false;
  }

  function leavePage(location: Location): void {
    if (history.length > 1) {
      history.back();
      return;
    }
    location.assign("https://www.youtube.com/");
  }

  function playAnyway(
    document: Document,
    location: Location,
    scan: () => void,
  ): void {
    allowCurrent(location);
    shortsSkipStreak = 0;
    removeCover();
    for (const video of document.querySelectorAll("video")) {
      if (!isVideo(video)) continue;
      const pending = video.play();
      void pending.catch(() => undefined);
    }
    scan();
  }

  function showCover(
    document: Document,
    location: Location,
    phrase: string,
    scan: () => void,
  ): void {
    if (cover && coverPhrase === phrase) {
      pauseVideos(document);
      return;
    }
    removeCover();
    coverPhrase = phrase;
    const dialog = document.createElement("div");
    dialog.className = "muty-cover muty-ui";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "muty-cover-title");

    const sheet = document.createElement("div");
    sheet.className = "sheet";
    const kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = "Muty";
    const heading = document.createElement("h2");
    heading.id = "muty-cover-title";
    heading.textContent = `This matches “${phrase}”.`;
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "This is a content you blocked.";
    const actions = document.createElement("div");
    actions.className = "actions";
    const play = document.createElement("button");
    play.type = "button";
    play.className = "primary";
    play.textContent = "Play it anyway";
    play.addEventListener("click", () => {
      playAnyway(document, location, scan);
    });
    const leave = document.createElement("button");
    leave.type = "button";
    leave.className = "quiet";
    leave.textContent = "Not now";
    leave.addEventListener("click", () => {
      leavePage(location);
    });
    actions.append(play, leave);
    sheet.append(kicker, heading, note, actions);
    dialog.append(sheet);
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        leavePage(location);
        return;
      }
      if (event.key !== "Tab") return;
      const first = play;
      const last = leave;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    const host =
      document.fullscreenElement instanceof HTMLElement
        ? document.fullscreenElement
        : document.documentElement;
    host.append(dialog);
    leave.focus();
    pauseVideos(document);
    cover = dialog;
  }

  function handleOpenVideo(input: PageScan): void {
    const kind = pageKind(input.location);
    const wantsCover = kind === "watch" && input.settings.coverWatch;
    const wantsSkip = kind === "shorts" && input.settings.skipShorts;
    if (
      !input.filtering ||
      input.settings.keywords.length === 0 ||
      (!wantsCover && !wantsSkip)
    ) {
      window.clearTimeout(skipTimer);
      removeCover();
      return;
    }

    const title = titleFromDocument(input.document, input.location);
    const phrase = title ? findMatch(title, input.settings.keywords) : null;
    const id = mediaId(input.location);
    if (!phrase || isAllowed(id)) {
      if (!phrase) shortsSkipStreak = 0;
      window.clearTimeout(skipTimer);
      removeCover();
      return;
    }

    if (wantsSkip && shortsSkipStreak < 6 && id && id !== lastSkippedId) {
      lastSkippedId = id;
      shortsSkipStreak += 1;
      if (clickNext(input.document)) {
        window.clearTimeout(skipTimer);
        skipTimer = window.setTimeout(() => {
          if (mediaId(input.location) === id)
            showCover(input.document, input.location, phrase, input.scan);
        }, 900);
        return;
      }
    }
    showCover(input.document, input.location, phrase, input.scan);
  }

  return {
    start(document) {
      watchPlayer(document);
      document.addEventListener("yt-navigate-finish", () => {
        watchPlayer(document);
      });
      document.addEventListener(
        "play",
        (event) => {
          if (!coverPhrase) return;
          if (isVideo(event.target)) event.target.pause();
        },
        true,
      );
    },
    onScan(input) {
      scanNow = input.scan;
      watchPlayer(input.document);
      handleOpenVideo(input);
    },
    onNavigate() {
      watchedPlayer = null;
      lastSkippedId = "";
      window.clearTimeout(skipTimer);
      removeCover();
    },
    onNavigateStart() {
      removeCover();
    },
  };
}
