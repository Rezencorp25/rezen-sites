/**
 * Inline-edit bridge for imported static sites.
 *
 * Why this exists: the IframeEmbed Puck block renders an imported HTML site
 * inside an <iframe>. Puck treats that iframe as one opaque block, so clicks
 * on inner DOM elements never reach the parent. This module ships a small
 * script injected into the iframe's contentDocument that wires up:
 *
 *   - hover outline on editable tags
 *   - click → postMessage(parent, {type: 'rzn:select', ...})
 *   - dblclick → contentEditable + blur → postMessage({type: 'rzn:edit', ...})
 *   - external nav/form-submit blockers so the editor stays put
 *
 * The parent (ImportedSiteRender) listens for those messages and renders an
 * inline side panel. Patches flow back via postMessage({type: 'rzn:patch'}).
 *
 * Same-origin guarantee: this only runs when the iframe src is served from
 * /imports/... (same Next.js origin). Cross-origin iframes silently skip.
 */

export const RZN_BRIDGE_NAMESPACE = "rzn-inline-edit-v1";

export type EditableTag =
  | "H1" | "H2" | "H3" | "H4" | "H5" | "H6"
  | "P" | "SPAN" | "LI" | "BUTTON"
  | "A" | "IMG";

/** CSS style properties we expose to the inline editor. */
export type StyleProp =
  | "color"
  | "backgroundColor"
  | "borderColor"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "width"
  | "height";

export type SelectedStyles = Partial<Record<StyleProp, string>>;

export type SelectMessage = {
  type: "rzn:select";
  selector: string;
  tag: EditableTag;
  text: string;
  attrs: { href?: string; src?: string; alt?: string };
  styles: SelectedStyles;
};

export type EditMessage = {
  type: "rzn:edit";
  selector: string;
  prop: "text" | "href" | "src" | "alt" | "style";
  styleProp?: StyleProp;
  value: string;
};

export type ReadyMessage = { type: "rzn:ready" };

export type ClearMessage = { type: "rzn:clear" };

/** parent → iframe: apply a patch immediately to the DOM. */
export type PatchMessage = {
  type: "rzn:patch";
  selector: string;
  prop: "text" | "href" | "src" | "alt" | "style";
  styleProp?: StyleProp;
  value: string;
};

export type BridgeMessage =
  | ReadyMessage
  | SelectMessage
  | EditMessage
  | ClearMessage;

/**
 * Builds the JS script (as a string) injected into the iframe. Kept as a
 * string so it can be appended via `<script>` and remain self-contained —
 * the iframe document doesn't share React or build tooling.
 */
export function buildBridgeScript(): string {
  return `
;(function(){
  if (window['${RZN_BRIDGE_NAMESPACE}']) return; // idempotent
  var NS = '${RZN_BRIDGE_NAMESPACE}';
  var EDITABLE = ['H1','H2','H3','H4','H5','H6','P','SPAN','LI','BUTTON','A','IMG'];
  var OUTLINE_STYLE = '__rzn-style';

  function cssPath(el) {
    // Robust selector: id > nth-of-type chain bounded to body.
    if (el.id) return '#' + CSS.escape(el.id);
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      var sel = node.tagName.toLowerCase();
      if (node.classList && node.classList.length) {
        var cls = Array.prototype.slice.call(node.classList)
          .filter(function(c){ return !c.startsWith('__rzn'); })
          .slice(0, 2)
          .map(function(c){ return '.' + CSS.escape(c); })
          .join('');
        sel += cls;
      }
      var parent = node.parentNode;
      if (parent && parent.children) {
        var idx = 0, siblingsOfSameTag = 0;
        for (var i = 0; i < parent.children.length; i++) {
          if (parent.children[i].tagName === node.tagName) {
            siblingsOfSameTag++;
            if (parent.children[i] === node) idx = siblingsOfSameTag;
          }
        }
        if (siblingsOfSameTag > 1) sel += ':nth-of-type(' + idx + ')';
      }
      parts.unshift(sel);
      node = node.parentNode;
    }
    return parts.join(' > ');
  }

  function isEditable(el) {
    return el && el.nodeType === 1 && EDITABLE.indexOf(el.tagName) !== -1;
  }

  function findEditableAncestor(el) {
    while (el && el !== document.body) {
      if (isEditable(el)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function ensureStyle() {
    if (document.getElementById(OUTLINE_STYLE)) return;
    var s = document.createElement('style');
    s.id = OUTLINE_STYLE;
    s.textContent = [
      '[data-rzn-hover]{outline:2px dashed #06b6d4 !important;outline-offset:2px !important;cursor:pointer !important}',
      '[data-rzn-selected]{outline:2px solid #06b6d4 !important;outline-offset:2px !important}',
      '[contenteditable=true]{outline:2px solid #f59e0b !important;outline-offset:2px !important;background:rgba(245,158,11,0.05) !important}',
      'a,button,form{pointer-events:auto}',
      'html.__rzn-edit a{cursor:pointer !important}',
      'html.__rzn-edit{user-select:none !important}',
      'html.__rzn-edit [contenteditable=true]{user-select:text !important}'
    ].join('');
    document.head.appendChild(s);
  }

  function getAttrs(el) {
    var out = {};
    if (el.tagName === 'A' && el.href) out.href = el.getAttribute('href') || '';
    if (el.tagName === 'IMG') {
      out.src = el.getAttribute('src') || '';
      out.alt = el.getAttribute('alt') || '';
    }
    return out;
  }

  // Read inline style first (what's persisted on disk), fall back to computed.
  // We prefer inline because computed returns rgb(...) strings that the color
  // picker can't easily round-trip back to hex, and computed inherits from
  // ancestors so it doesn't reflect what's *on this element*.
  function getStyles(el) {
    var inline = el.style || {};
    var cs;
    try { cs = window.getComputedStyle(el); } catch(e) { cs = {}; }
    function pick(prop) {
      if (inline && inline[prop]) return inline[prop];
      return cs[prop] || '';
    }
    return {
      color: pick('color'),
      backgroundColor: pick('backgroundColor'),
      borderColor: pick('borderColor'),
      fontFamily: pick('fontFamily'),
      fontSize: pick('fontSize'),
      fontWeight: pick('fontWeight'),
      width: inline.width || '',
      height: inline.height || ''
    };
  }

  var hoverEl = null;
  var selectedEl = null;

  function clearHover() {
    if (hoverEl) hoverEl.removeAttribute('data-rzn-hover');
    hoverEl = null;
  }

  // ─── Image resize overlay ────────────────────────────────────────────
  // When an IMG is selected we render a transparent overlay with 8 drag
  // handles (4 corners + 4 mid-edges) Canva-style. Drag → live update
  // el.style.width/height. Shift held → lock aspect ratio.
  var resizeOverlay = null;
  var resizeAspect = 1;

  function detachResizeOverlay() {
    if (resizeOverlay && resizeOverlay.parentNode) {
      resizeOverlay.parentNode.removeChild(resizeOverlay);
    }
    resizeOverlay = null;
  }

  function positionResizeOverlay(img) {
    if (!resizeOverlay) return;
    var rect = img.getBoundingClientRect();
    var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    resizeOverlay.style.left = (rect.left + scrollX) + 'px';
    resizeOverlay.style.top = (rect.top + scrollY) + 'px';
    resizeOverlay.style.width = rect.width + 'px';
    resizeOverlay.style.height = rect.height + 'px';
  }

  function attachResizeOverlay(img) {
    detachResizeOverlay();
    if (!img.naturalWidth) return;
    resizeAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
    var overlay = document.createElement('div');
    overlay.setAttribute('data-rzn-resize-overlay', '1');
    overlay.style.cssText = [
      'position:absolute',
      'pointer-events:none',
      'z-index:2147483646',
      'box-sizing:border-box',
      'border:1px solid #06b6d4'
    ].join(';');
    var handles = ['nw','n','ne','e','se','s','sw','w'];
    handles.forEach(function(name){
      var h = document.createElement('div');
      h.setAttribute('data-rzn-resize-handle', name);
      h.style.cssText = [
        'position:absolute',
        'width:10px',
        'height:10px',
        'background:#fff',
        'border:1px solid #06b6d4',
        'border-radius:2px',
        'pointer-events:auto',
        'cursor:' + cursorFor(name)
      ].join(';');
      // Place handle at corner/edge
      if (name.indexOf('n') !== -1) h.style.top = '-5px';
      if (name.indexOf('s') !== -1) h.style.bottom = '-5px';
      if (name.indexOf('w') !== -1) h.style.left = '-5px';
      if (name.indexOf('e') !== -1) h.style.right = '-5px';
      if (name === 'n' || name === 's') { h.style.left = 'calc(50% - 5px)'; }
      if (name === 'e' || name === 'w') { h.style.top = 'calc(50% - 5px)'; }
      h.addEventListener('mousedown', function(ev){ startResize(ev, img, name); });
      overlay.appendChild(h);
    });
    document.body.appendChild(overlay);
    resizeOverlay = overlay;
    positionResizeOverlay(img);
  }

  function cursorFor(name) {
    var map = { nw:'nwse-resize', n:'ns-resize', ne:'nesw-resize',
                e:'ew-resize', se:'nwse-resize', s:'ns-resize',
                sw:'nesw-resize', w:'ew-resize' };
    return map[name] || 'pointer';
  }

  function startResize(ev, img, dir) {
    ev.preventDefault();
    ev.stopPropagation();
    var startX = ev.clientX, startY = ev.clientY;
    var startRect = img.getBoundingClientRect();
    var startW = startRect.width, startH = startRect.height;
    var shiftLock = false;
    function move(e) {
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      shiftLock = e.shiftKey;
      var w = startW, h = startH;
      // Compute new width based on which handle
      if (dir.indexOf('e') !== -1) w = startW + dx;
      if (dir.indexOf('w') !== -1) w = startW - dx;
      if (dir.indexOf('s') !== -1) h = startH + dy;
      if (dir.indexOf('n') !== -1) h = startH - dy;
      // For corner handles, lock aspect ratio unless user wants free resize
      // For edge handles, lock by default UNLESS shift (inverse of Figma)
      var isCorner = dir.length === 2;
      if ((isCorner && !shiftLock) || (!isCorner && shiftLock)) {
        // Lock aspect: derive missing dimension from the more-changed one
        if (Math.abs(dx) > Math.abs(dy)) {
          h = w / resizeAspect;
        } else {
          w = h * resizeAspect;
        }
      }
      // Clamp min 20px, max parent width (or 2000)
      var parentW = img.parentNode && img.parentNode.getBoundingClientRect
        ? img.parentNode.getBoundingClientRect().width
        : 2000;
      w = Math.max(20, Math.min(w, parentW));
      h = Math.max(20, h);
      img.style.setProperty('width', Math.round(w) + 'px', 'important');
      img.style.setProperty('height', Math.round(h) + 'px', 'important');
      positionResizeOverlay(img);
    }
    function up() {
      document.removeEventListener('mousemove', move, true);
      document.removeEventListener('mouseup', up, true);
      // Persist via rzn:edit so the parent queues a patch
      var finalRect = img.getBoundingClientRect();
      parent.postMessage({
        type: 'rzn:edit',
        selector: cssPath(img),
        prop: 'style',
        styleProp: 'width',
        value: Math.round(finalRect.width) + 'px'
      }, '*');
      parent.postMessage({
        type: 'rzn:edit',
        selector: cssPath(img),
        prop: 'style',
        styleProp: 'height',
        value: Math.round(finalRect.height) + 'px'
      }, '*');
    }
    document.addEventListener('mousemove', move, true);
    document.addEventListener('mouseup', up, true);
  }

  function clearSelected() {
    detachResizeOverlay();
    if (selectedEl) {
      selectedEl.removeAttribute('data-rzn-selected');
      if (selectedEl.getAttribute('contenteditable') === 'true') {
        selectedEl.removeAttribute('contenteditable');
      }
    }
    selectedEl = null;
  }

  function onMouseOver(e) {
    var t = findEditableAncestor(e.target);
    if (!t || t === hoverEl) return;
    clearHover();
    hoverEl = t;
    t.setAttribute('data-rzn-hover', '1');
  }

  function onMouseOut() {
    clearHover();
  }

  function onClick(e) {
    var t = findEditableAncestor(e.target);
    if (!t) return;
    // Block native nav/submit so the editor stays put.
    e.preventDefault();
    e.stopPropagation();
    if (selectedEl && selectedEl !== t) clearSelected();
    selectedEl = t;
    t.setAttribute('data-rzn-selected', '1');
    // Image: render resize handles overlay so user can drag-resize Canva-style.
    if (t.tagName === 'IMG') attachResizeOverlay(t);
    parent.postMessage({
      type: 'rzn:select',
      selector: cssPath(t),
      tag: t.tagName,
      text: t.tagName === 'IMG' ? '' : (t.textContent || '').trim(),
      attrs: getAttrs(t),
      styles: getStyles(t),
    }, '*');
  }

  function onDblClick(e) {
    var t = findEditableAncestor(e.target);
    if (!t) return;
    if (t.tagName === 'IMG') return; // images aren't contentEditable
    e.preventDefault();
    e.stopPropagation();
    t.setAttribute('contenteditable', 'true');
    t.focus();
    // Select all on dblclick for fast replace
    try {
      var range = document.createRange();
      range.selectNodeContents(t);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch(err) {}
  }

  function onBlur(e) {
    var t = e.target;
    if (!t || t.getAttribute('contenteditable') !== 'true') return;
    t.removeAttribute('contenteditable');
    parent.postMessage({
      type: 'rzn:edit',
      selector: cssPath(t),
      prop: 'text',
      value: (t.textContent || '').trim(),
    }, '*');
  }

  function onSubmit(e) {
    // Block any form submit inside the edited site.
    e.preventDefault();
    e.stopPropagation();
  }

  // camelCase → kebab-case (backgroundColor → background-color)
  function toKebab(s) {
    return s.replace(/[A-Z]/g, function(m){ return '-' + m.toLowerCase(); });
  }

  // Mirror of server-side route GOOGLE_FONTS map. Used to inject <link> tags
  // into the iframe head so live-preview shows the actual webfont instead of
  // the OS fallback. Idempotent — keyed on href.
  var GOOGLE_FONTS = {
    'Inter': 'Inter:wght@100..900',
    'Manrope': 'Manrope:wght@200..800',
    'DM Sans': 'DM+Sans:wght@100..1000',
    'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@200..800',
    'Space Grotesk': 'Space+Grotesk:wght@300..700',
    'Playfair Display': 'Playfair+Display:wght@400..900',
    'Lora': 'Lora:wght@400..700',
    'Instrument Serif': 'Instrument+Serif',
    'JetBrains Mono': 'JetBrains+Mono:wght@100..800',
    'Bebas Neue': 'Bebas+Neue'
  };

  function firstFamilyName(value) {
    var first = (value || '').split(',')[0] || '';
    return first.replace(/['"]/g, '').trim();
  }

  function ensureFontLink(value) {
    var fam = firstFamilyName(value);
    var token = GOOGLE_FONTS[fam];
    if (!token) return;
    var href = 'https://fonts.googleapis.com/css2?family=' + token + '&display=swap';
    var existing = document.querySelector('link[href="' + href + '"]');
    if (existing) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function onMessage(e) {
    var msg = e && e.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'rzn:patch') {
      try {
        var el = document.querySelector(msg.selector);
        if (!el) return;
        if (msg.prop === 'text') el.textContent = msg.value;
        else if (msg.prop === 'href' && el.tagName === 'A') el.setAttribute('href', msg.value);
        else if (msg.prop === 'src' && el.tagName === 'IMG') el.setAttribute('src', msg.value);
        else if (msg.prop === 'alt' && el.tagName === 'IMG') el.setAttribute('alt', msg.value);
        else if (msg.prop === 'style' && msg.styleProp) {
          // setProperty with kebab-case + priority "important" so inline wins
          // over external CSS without us having to walk the cascade.
          if (msg.value) {
            el.style.setProperty(toKebab(msg.styleProp), msg.value, 'important');
          } else {
            el.style.removeProperty(toKebab(msg.styleProp));
          }
          // Mirror server-side font-link injection so live preview shows the
          // actual webfont, not OS fallback.
          if (msg.styleProp === 'fontFamily' && msg.value) {
            ensureFontLink(msg.value);
          }
          // Reposition the resize overlay if dimensions changed from the
          // side panel (input numerico → patch → bridge).
          if ((msg.styleProp === 'width' || msg.styleProp === 'height')
              && el === selectedEl) {
            repositionOverlay();
          }
        }
      } catch(err) {}
      return;
    }
    if (msg.type === 'rzn:clear') {
      clearSelected();
      return;
    }
  }

  function repositionOverlay() {
    if (resizeOverlay && selectedEl && selectedEl.tagName === 'IMG') {
      positionResizeOverlay(selectedEl);
    }
  }

  function activate() {
    ensureStyle();
    document.documentElement.classList.add('__rzn-edit');
    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mouseout', onMouseOut, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('dblclick', onDblClick, true);
    document.addEventListener('focusout', onBlur, true);
    document.addEventListener('submit', onSubmit, true);
    window.addEventListener('message', onMessage);
    // Keep the resize overlay locked to the IMG when the user scrolls or
    // the viewport resizes.
    window.addEventListener('scroll', repositionOverlay, true);
    window.addEventListener('resize', repositionOverlay, true);
    parent.postMessage({ type: 'rzn:ready' }, '*');
  }

  window[NS] = { activated: true };
  activate();
})();
`;
}
