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

  function clearSelected() {
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
          el.style.setProperty(toKebab(msg.styleProp), msg.value, 'important');
        }
      } catch(err) {}
      return;
    }
    if (msg.type === 'rzn:clear') {
      clearSelected();
      return;
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
    parent.postMessage({ type: 'rzn:ready' }, '*');
  }

  window[NS] = { activated: true };
  activate();
})();
`;
}
