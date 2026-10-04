/**
 * STATE MANAGEMENT
 */

// Custom chatbots (user-defined)
let customChatbots = [];
let hiddenChatbots = [];

function loadCustomChatbots() {
  try {
    const raw = localStorage.getItem(CUSTOM_CHATBOTS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        customChatbots = data;
      }
    }
  } catch {
    customChatbots = [];
  }
}

function saveCustomChatbots() {
  try {
    localStorage.setItem(CUSTOM_CHATBOTS_KEY, JSON.stringify(customChatbots));
  } catch {
    // Storage full or unavailable
  }
}

function loadHiddenChatbots() {
  try {
    const raw = localStorage.getItem(HIDDEN_CHATBOTS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        hiddenChatbots = data.map((name) => String(name)).filter(Boolean);
      }
    }
  } catch {
    hiddenChatbots = [];
  }
}

function saveHiddenChatbots() {
  try {
    localStorage.setItem(HIDDEN_CHATBOTS_KEY, JSON.stringify(hiddenChatbots));
  } catch {
    // Storage full or unavailable
  }
}

function hideChatbot(botName) {
  const name = String(botName || "").trim();
  if (!name || hiddenChatbots.includes(name)) return;
  hiddenChatbots = [...hiddenChatbots, name];
  saveHiddenChatbots();
}

function showChatbot(botName) {
  const name = String(botName || "").trim();
  if (!name) return;
  hiddenChatbots = hiddenChatbots.filter((entry) => entry !== name);
  saveHiddenChatbots();
}

function resetHiddenChatbots() {
  hiddenChatbots = [];
  saveHiddenChatbots();
}

// Templates library
let savedTemplates = [];

function loadTemplates() {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        savedTemplates = data;
      }
    }
  } catch {
    savedTemplates = [];
  }
}

function saveTemplates() {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(savedTemplates));
  } catch {
    // Storage full or unavailable
  }
}

function isHiddenChatbot(botName) {
  return hiddenChatbots.includes(botName);
}

function getAllChatbots() {
  return [...builtInChatbots, ...customChatbots];
}

function getVisibleChatbots() {
  return getAllChatbots().filter((bot) => !isHiddenChatbot(bot.name));
}

// Main App state
const state = {
  title: "",
  tags: "",
  notes: "",
  template: "",
  vars: {},
};

// Debounce timer for localStorage saves
let saveTimeout = null;

function saveStateToStorage() {
  try {
    const data = {
      title: state.title,
      tags: state.tags,
      notes: state.notes,
      template: state.template,
      vars: state.vars,
      _savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage full or unavailable - ignore
  }
}

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveStateToStorage, SAVE_DEBOUNCE_MS);
}

function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return false;

    state.title = String(data.title || "");
    state.tags = String(data.tags || "");
    state.notes = String(data.notes || "");
    state.template = String(data.template || "");
    state.vars = data.vars && typeof data.vars === "object" ? data.vars : {};

    return true;
  } catch {
    return false;
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Text Utilities
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function canonicalizeText(s) {
  if (!s) return "";
  let out = String(s);
  out = out.replace(/\r\n/g, "\n");
  out = out.replace(/[ \t]+\n/g, "\n");
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.trim();
  return out;
}

function canonicalizeVarsObject(varsObj) {
  const entries = Object.entries(varsObj || {})
    .map(([k, v]) => [String(k), canonicalizeText(String(v || ""))])
    .sort((a, b) => a[0].localeCompare(b[0]));
  return entries;
}

/**
 * Variables: detect {{var}} tokens
 */
function extractVariables(template) {
  const re = /\{\{\s*([^{}]+?)\s*\}\}/g;
  const found = [];
  const seen = new Set();

  let match;
  while ((match = re.exec(template)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);
    found.push(raw);
  }

  return found;
}

function resolveTemplate(template, vars) {
  const keys = Object.keys(vars);

  let result = template;
  keys.forEach((key) => {
    const value = (vars[key] || "").trim();
    if (!value) return;

    const re = new RegExp("\\{\\{\\s*" + escapeRegex(key) + "\\s*\\}\\}", "g");
    result = result.replace(re, value);
  });

  return result;
}

function countMissingVars(varKeys) {
  return varKeys.filter((k) => !(state.vars[k] || "").trim()).length;
}

function getFilledPrompt() {
  return resolveTemplate(state.template, state.vars);
}

/**
 * Serialization logic
 */
function serializeShareState(options) {
  const includeVars = options.includeVars;
  const includeMeta = options.includeMeta;
  const canonicalize = options.canonicalize;

  const payload = { v: 2 };

  const title = includeMeta ? state.title : "";
  const tags = includeMeta ? state.tags : "";
  const notes = includeMeta ? state.notes : "";
  const template = state.template;

  const tpl = canonicalize ? canonicalizeText(template) : template;

  if (tpl && tpl.trim()) payload.p = tpl;
  if (title && title.trim()) payload.t = title.trim();
  if (tags && tags.trim()) payload.g = tags.trim();
  if (notes && notes.trim()) payload.n = notes.trim();
  if (canonicalize) payload.c = 1;

  if (includeVars) {
    const pairs = canonicalize
      ? canonicalizeVarsObject(state.vars)
      : Object.entries(state.vars || {})
          .map(([k, v]) => [String(k), String(v || "")])
          .sort((a, b) => a[0].localeCompare(b[0]));

    const nonEmpty = pairs.filter(([, v]) => String(v).trim().length > 0);
    if (nonEmpty.length > 0) payload.r = nonEmpty;
  }

  return payload;
}

function buildBaseUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function buildShareLink(options) {
  const payload = serializeShareState(options);
  const json = JSON.stringify(payload);

  // Use LZ-String compression (URL-safe)
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${buildBaseUrl()}#p=${compressed}`;
}

function tryLoadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const hashParams = new URLSearchParams(hash);

  // 1) LZ-string format: #p=... or ?p=...
  const compressed = hashParams.get("p") || params.get("p");
  if (compressed) {
    try {
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      if (!json) return false;

      const data = JSON.parse(json);
      if (!data || typeof data !== "object") return false;

      if (data.v === 2) {
        state.title = String(data.t || "");
        state.tags = String(data.g || "");
        state.notes = String(data.n || "");
        state.template = String(data.p || "");
        state.vars = {};
        if (Array.isArray(data.r)) {
          data.r.forEach((pair) => {
            if (!Array.isArray(pair) || pair.length < 2) return;
            const k = String(pair[0] || "");
            const v = String(pair[1] || "");
            if (!k) return;
            state.vars[k] = v;
          });
        }
        return true;
      }

      // v1 legacy object keys
      state.title = String(data.title || "");
      state.tags = String(data.tags || "");
      state.notes = String(data.notes || "");
      state.template = String(data.template || "");
      state.vars = data.vars && typeof data.vars === "object" ? data.vars : {};
      return true;
    } catch {
      return false;
    }
  }

  // 2) Backward compatible format: ?prompt=...
  const legacyPrompt = params.get("prompt");
  if (legacyPrompt) {
    const decoded = decodeURIComponent(legacyPrompt.replace(/\+/g, " "));
    state.template = decoded;

    const legacyTitle = params.get("title");
    const legacyNotes = params.get("notes");
    const legacyTags = params.get("tags");

    if (legacyTitle) state.title = decodeURIComponent(legacyTitle.replace(/\+/g, " "));
    if (legacyNotes) state.notes = decodeURIComponent(legacyNotes.replace(/\+/g, " "));
    if (legacyTags) state.tags = decodeURIComponent(legacyTags.replace(/\+/g, " "));

    return true;
  }

  return false;
}

