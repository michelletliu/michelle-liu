/**
 * Sends the Gallery seal (and Escape) back to the exact spot on home the
 * visitor left from.
 *
 * Two routes, both landing the offset before the first paint. Restoring from a
 * React effect is not an option for either: effects run after the browser has
 * already painted the new document, which is the visible jump.
 *
 * 1. `history.back()` when this session provably pushed home → gallery. The
 *    browser restores the offset itself, and this is the only route that can be
 *    served from the back/forward cache — worth keeping, because that is what
 *    makes the return instant instead of a full reload. (Not in dev: Next's HMR
 *    socket makes the page ineligible, so locally this always reloads.)
 * 2. Otherwise a plain assign, with HOME_SCROLL_RESTORE_SCRIPT placing the
 *    offset from `<head>`. Covers a direct `/gallery` visit, `/project/gallery`
 *    replacing its own entry, and entries stacked on top of the room.
 */

const SCROLL_KEY = "home-return-scroll";
const RESTORE_KEY = "home-return-scroll-restore";
/** `history.length` on home, immediately before the push into `/gallery`. */
const DEPTH_KEY = "home-return-depth";

type HomeReturnRoute = "history" | "assign";

function clearReturnState(): void {
  try {
    sessionStorage.removeItem(SCROLL_KEY);
    sessionStorage.removeItem(DEPTH_KEY);
  } catch {
    /* ignore */
  }
}

/** Call immediately before hard-navigating from home → `/gallery`. */
export function rememberHomeScrollForReturn(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SCROLL_KEY,
      String(Math.max(0, Math.round(window.scrollY))),
    );
    sessionStorage.setItem(DEPTH_KEY, String(window.history.length));
  } catch {
    /* private mode / quota — the seal still works, just without restore */
  }
}

/**
 * Decide how the seal should leave the room, and arm whichever mechanism that
 * route needs. Consumes the stored trip either way, so a later visit typed
 * straight into the address bar never inherits a stale offset.
 */
function resolveHomeReturn(): HomeReturnRoute {
  if (typeof window === "undefined") return "assign";

  let scroll: string | null = null;
  let depth: string | null = null;
  try {
    scroll = sessionStorage.getItem(SCROLL_KEY);
    depth = sessionStorage.getItem(DEPTH_KEY);
  } catch {
    return "assign";
  }

  if (scroll == null) return "assign";

  /*
   * Audited: nothing in the room mutates history. The only call while `/gallery`
   * is open is Next's own `replaceState("/gallery")` on boot, which adds no
   * entry — `history.length` was measured flat across opening the composer, the
   * Met picker and the info dialog, and the save/share flow only builds a link
   * string. So a matching count means the entry behind us is home.
   *
   * Deliberately an exact match. A looser test would also accept the case where
   * the push truncated a forward entry *and* something later pushed on top,
   * which lands back on the wrong entry. The reload path below is now equally
   * flash-free, so there is nothing to gain by stretching this.
   */
  const expected = depth == null ? NaN : Number(depth) + 1;
  if (Number.isFinite(expected) && window.history.length === expected) {
    clearReturnState();
    return "history";
  }

  // Reload path. HOME_SCROLL_RESTORE_SCRIPT picks this up before first paint.
  try {
    sessionStorage.setItem(RESTORE_KEY, "1");
  } catch {
    /* ignore */
  }
  return "assign";
}

/**
 * Consume a pending manual restore. Returns the offset, or `null` when there is
 * nothing to place (direct entry, already consumed, or the back route handled
 * it natively).
 */
export function consumeHomeScrollReturn(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const shouldRestore = sessionStorage.getItem(RESTORE_KEY) === "1";
    sessionStorage.removeItem(RESTORE_KEY);
    if (!shouldRestore) return null;

    const raw = sessionStorage.getItem(SCROLL_KEY);
    clearReturnState();
    if (raw == null) return null;

    const y = Number(raw);
    return Number.isFinite(y) && y >= 0 ? y : null;
  } catch {
    return null;
  }
}

/**
 * Leave for home along the best available route. `assign` is passed in so the
 * seal keeps its own href semantics.
 */
/*
 * Runs blocking in `<head>`, so it lands the offset before the browser's first
 * paint of home — the whole point, since React's effects only run after it.
 *
 * The height prop is what makes that possible: in `<head>` the body has not
 * parsed yet, the document is one viewport tall, and a bare `scrollTo` would be
 * clamped to 0. Propping `html` to the offset plus a viewport gives the scroll
 * somewhere to land, and it is dropped once real content can hold the position.
 */
export const HOME_SCROLL_RESTORE_SCRIPT = `(function(){try{
if(location.pathname!=="/")return;
var ss=sessionStorage;
if(ss.getItem("${RESTORE_KEY}")!=="1")return;
var raw=ss.getItem("${SCROLL_KEY}");
ss.removeItem("${RESTORE_KEY}");ss.removeItem("${SCROLL_KEY}");ss.removeItem("${DEPTH_KEY}");
var y=Number(raw);
if(!isFinite(y)||y<=0)return;
var prop=document.createElement("style");
prop.textContent="html{min-height:"+(y+window.innerHeight)+"px}";
document.head.appendChild(prop);
var put=function(){window.scrollTo(0,y);};
put();
document.addEventListener("DOMContentLoaded",put);
addEventListener("load",function(){put();requestAnimationFrame(function(){
prop.remove();put();});});
}catch(e){}})();`;

export function navigateHomeWithScrollReturn(href = "/"): void {
  if (resolveHomeReturn() === "assign") {
    window.location.assign(href);
    return;
  }

  window.history.back();
  // Nothing below runs on a successful back: a restored page is frozen and a
  // reloaded one is torn down. This only fires if the entry vanished.
  window.setTimeout(() => {
    if (window.location.pathname.startsWith("/gallery")) {
      window.location.assign(href);
    }
  }, 500);
}
