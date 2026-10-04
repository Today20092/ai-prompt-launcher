/**
 * UI MANAGEMENT & DOM ELEMENTS
 */

// --- Elements ---
let themeToggle, sunIcon, moonIcon;
let titleInput, tagsInput, toggleNotes, notesWrap, notesInput;
let promptInput, charCount;
let varsSection, varsList, resetVarsBtn, filledPreview, missingVarsHint, toggleFilledPreview, filledPreviewWrapper, previewChevron;
let copyFilledBtn, shareBtn, clearBtn, fabButton;
let chatbotButtons;
let toast, toastText;
let toastActionBtn;

// Share modal elements
let shareModal, closeShareModal, shareTabs, sharePanels;
let includeVarsInLink, includeMetaInLink, canonicalizeInLink, shareLinkInput, copyLinkBtn;
let nativeShareWrapper, nativeShareBtn;
let shareFilledPreview, shareTemplatePreview, shareMessagePreview;
let copyFilledFromModalBtn, copyTemplateBtn, copyMessageBtn;

// Custom chatbot modal elements
let customChatbotModal, closeCustomChatbotModal, customBotName, customBotIcon, customBotUrl, customBotSupportsQuery, saveCustomChatbotBtn;

// Template library modal elements
let templateLibraryModal, closeTemplateLibrary, templateLibraryBtn, saveToLibraryBtn, templateList, exportTemplatesBtn, importTemplatesBtn, importTemplatesInput;
let templateLibraryTriggers, clearDraftTriggers;

// Clear confirm modal
let clearConfirmModal, closeClearConfirmModal, cancelClearBtn, confirmClearBtn;

let modalScrollLockCount = 0;
let activeModalState = null;
let toastTimer = null;

function lockPageScroll() {
  modalScrollLockCount += 1;
  document.documentElement.classList.add("overflow-hidden");
  document.body.classList.add("overflow-hidden");
}

function unlockPageScroll() {
  modalScrollLockCount = Math.max(0, modalScrollLockCount - 1);
  if (modalScrollLockCount === 0) {
    document.documentElement.classList.remove("overflow-hidden");
    document.body.classList.remove("overflow-hidden");
  }
}

function getFocusableElements(root) {
  if (!root) return [];

  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return Array.from(root.querySelectorAll(selector)).filter((el) => {
    return (
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true" &&
      el.getClientRects().length > 0
    );
  });
}

function openModal(modalEl, options = {}) {
  if (!modalEl) return;

  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  activeModalState = { modalEl, opener };

  modalEl.classList.remove("hidden");
  modalEl.classList.add("flex");
  lockPageScroll();

  const focusTarget = options.initialFocus || getFocusableElements(modalEl)[0] || modalEl;
  window.setTimeout(() => {
    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }
    if (options.select && typeof focusTarget.select === "function") {
      focusTarget.select();
    }
  }, 0);
}

function closeModal(modalEl, options = {}) {
  if (!modalEl || modalEl.classList.contains("hidden")) return;

  modalEl.classList.add("hidden");
  modalEl.classList.remove("flex");
  unlockPageScroll();

  const restoreFocus = options.restoreFocus !== false;
  if (activeModalState?.modalEl === modalEl) {
    const opener = activeModalState.opener;
    activeModalState = null;
    if (restoreFocus && opener && document.contains(opener)) {
      window.setTimeout(() => opener.focus(), 0);
    }
  }
}

function getOpenModal() {
  return activeModalState?.modalEl || null;
}

function trapModalFocus(e) {
  const modalEl = getOpenModal();
  if (!modalEl) return false;

  if (e.key === "Escape") {
    e.preventDefault();
    closeModal(modalEl);
    return true;
  }

  if (e.key !== "Tab") return false;

  const focusables = getFocusableElements(modalEl);
  if (focusables.length === 0) {
    e.preventDefault();
    if (typeof modalEl.focus === "function") modalEl.focus();
    return true;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
    return true;
  }

  if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
    return true;
  }

  return false;
}

/**
 * Initialize DOM element references
 */
function initElements() {
  themeToggle = document.getElementById("themeToggle");
  sunIcon = document.getElementById("sunIcon");
  moonIcon = document.getElementById("moonIcon");

  titleInput = document.getElementById("titleInput");
  tagsInput = document.getElementById("tagsInput");
  toggleNotes = document.getElementById("toggleNotes");
  notesWrap = document.getElementById("notesWrap");
  notesInput = document.getElementById("notesInput");

  promptInput = document.getElementById("promptInput");
  charCount = document.getElementById("charCount");

  varsSection = document.getElementById("varsSection");
  varsList = document.getElementById("varsList");
  resetVarsBtn = document.getElementById("resetVarsBtn");
  filledPreview = document.getElementById("filledPreview");
  missingVarsHint = document.getElementById("missingVarsHint");
  toggleFilledPreview = document.getElementById("toggleFilledPreview");
  filledPreviewWrapper = document.getElementById("filledPreviewWrapper");
  previewChevron = document.getElementById("previewChevron");

  copyFilledBtn = document.getElementById("copyFilledBtn");
  shareBtn = document.getElementById("shareBtn");
  clearBtn = document.getElementById("clearBtn");
  fabButton = document.getElementById("fabButton");

  chatbotButtons = document.getElementById("chatbotButtons");

  toast = document.getElementById("toast");
  toastText = document.getElementById("toastText");
  toastActionBtn = document.getElementById("toastAction");

  // Share modal
  shareModal = document.getElementById("shareModal");
  closeShareModal = document.getElementById("closeShareModal");
  shareTabs = Array.from(document.querySelectorAll(".shareTab"));
  sharePanels = Array.from(document.querySelectorAll(".sharePanel"));
  includeVarsInLink = document.getElementById("includeVarsInLink");
  includeMetaInLink = document.getElementById("includeMetaInLink");
  canonicalizeInLink = document.getElementById("canonicalizeInLink");
  shareLinkInput = document.getElementById("shareLinkInput");
  copyLinkBtn = document.getElementById("copyLinkBtn");
  nativeShareWrapper = document.getElementById("nativeShareWrapper");
  nativeShareBtn = document.getElementById("nativeShareBtn");
  shareFilledPreview = document.getElementById("shareFilledPreview");
  shareTemplatePreview = document.getElementById("shareTemplatePreview");
  shareMessagePreview = document.getElementById("shareMessagePreview");
  copyFilledFromModalBtn = document.getElementById("copyFilledFromModalBtn");
  copyTemplateBtn = document.getElementById("copyTemplateBtn");
  copyMessageBtn = document.getElementById("copyMessageBtn");

  // Custom chatbot modal
  customChatbotModal = document.getElementById("customChatbotModal");
  closeCustomChatbotModal = document.getElementById("closeCustomChatbotModal");
  customBotName = document.getElementById("customBotName");
  customBotIcon = document.getElementById("customBotIcon");
  customBotUrl = document.getElementById("customBotUrl");
  customBotSupportsQuery = document.getElementById("customBotSupportsQuery");
  saveCustomChatbotBtn = document.getElementById("saveCustomChatbotBtn");

  // Template library modal
  templateLibraryModal = document.getElementById("templateLibraryModal");
  closeTemplateLibrary = document.getElementById("closeTemplateLibrary");
  templateLibraryBtn = document.getElementById("templateLibraryBtn");
  saveToLibraryBtn = document.getElementById("saveToLibraryBtn");
  templateList = document.getElementById("templateList");
  exportTemplatesBtn = document.getElementById("exportTemplatesBtn");
  importTemplatesBtn = document.getElementById("importTemplatesBtn");
  importTemplatesInput = document.getElementById("importTemplatesInput");
  templateLibraryTriggers = Array.from(
    document.querySelectorAll("[data-template-library-trigger]"),
  );
  clearDraftTriggers = Array.from(
    document.querySelectorAll("[data-clear-draft-trigger]"),
  );

  // Clear confirm modal
  clearConfirmModal = document.getElementById("clearConfirmModal");
  closeClearConfirmModal = document.getElementById("closeClearConfirmModal");
  cancelClearBtn = document.getElementById("cancelClearBtn");
  confirmClearBtn = document.getElementById("confirmClearBtn");

  // Wire auto-resize for primary textareas
  const _autoResizeTargets = [
    promptInput,
    notesInput,
    filledPreview,
    shareFilledPreview,
    shareTemplatePreview,
    shareMessagePreview,
  ];
  _autoResizeTargets.forEach((el) => {
    if (el) wireAutoResize(el);
  });
}

/**
 * UI Helpers
 */
function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains("dark");
  if (isDark) {
    sunIcon.classList.remove("hidden");
    moonIcon.classList.add("hidden");
  } else {
    sunIcon.classList.add("hidden");
    moonIcon.classList.remove("hidden");
  }
}

function hideToast() {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  toast.classList.add("opacity-0", "translate-y-2");
  toast.classList.remove("opacity-100", "translate-y-0");
  if (toastActionBtn) {
    toastActionBtn.classList.add("hidden");
    toastActionBtn.onclick = null;
  }
}

function showToast(message, options = {}) {
  const actionLabel = options.actionLabel || "";
  const actionHandler = typeof options.actionHandler === "function" ? options.actionHandler : null;
  const duration = typeof options.duration === "number" ? options.duration : 1600;

  toastText.textContent = message;

  if (toastTimer) clearTimeout(toastTimer);

  if (toastActionBtn) {
    if (actionHandler) {
      toastActionBtn.textContent = actionLabel || "Undo";
      toastActionBtn.classList.remove("hidden");
      toastActionBtn.onclick = async () => {
        const handler = actionHandler;
        hideToast();
        if (handler) await handler();
      };
    } else {
      toastActionBtn.classList.add("hidden");
      toastActionBtn.onclick = null;
    }
  }

  toast.classList.remove("opacity-0", "translate-y-2");
  toast.classList.add("opacity-100", "translate-y-0");
  toastTimer = window.setTimeout(() => {
    hideToast();
  }, duration);
}

function showUndoToast(message, actionHandler) {
  showToast(message, {
    actionLabel: "Undo",
    actionHandler,
    duration: 5000,
  });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const temp = document.createElement("textarea");
      temp.value = text;
      temp.setAttribute("readonly", "");
      temp.style.position = "absolute";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      return true;
    } catch {
      return false;
    }
  }
}

function autoResizeTextarea(el) {
  if (!el) return;
  try {
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";

    window.scrollTo(scrollLeft, scrollTop);
  } catch (e) {
    // ignore
  }
}

function wireAutoResize(el) {
  if (!el) return;
  el.style.overflow = "hidden";
  el.addEventListener("input", () => autoResizeTextarea(el));
  autoResizeTextarea(el);
}

/**
 * Native Share API support
 */
function supportsNativeShare() {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  );
}

async function triggerNativeShare(url, title, text) {
  const shareData = { url };
  if (title) shareData.title = title;
  if (text) shareData.text = text;

  try {
    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    } else {
      await navigator.share(shareData);
      return true;
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.warn("Native share failed:", err);
    }
    return false;
  }
}

/**
 * Derived & Complex UI Updates
 */
function renderVariables(varKeys) {
  Object.keys(state.vars).forEach((k) => {
    if (!varKeys.includes(k)) delete state.vars[k];
  });

  if (varKeys.length === 0) {
    varsSection.classList.add("hidden");
    varsList.innerHTML = "";
    filledPreview.value = resolveTemplate(state.template, state.vars);
    autoResizeTextarea(filledPreview);
    missingVarsHint.classList.add("hidden");
    return;
  }

  varsSection.classList.remove("hidden");
  varsList.innerHTML = "";

  varKeys.forEach((key) => {
    if (state.vars[key] === undefined) state.vars[key] = "";

    const wrap = document.createElement("div");
    wrap.className = "rounded-[24px] border border-md-outline-variant/70 dark:border-gray-700/80 bg-md-surface-container-high/75 dark:bg-gray-700/45 p-3 shadow-elevation-1";

    wrap.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-2">
        <label class="block text-label-lg font-medium text-md-surface-on dark:text-gray-200 break-words">
          ${key}
        </label>
        <span class="shrink-0 rounded-full border border-md-outline-variant/70 dark:border-gray-600 px-2 py-0.5 text-label-sm text-md-surface-on-variant dark:text-gray-300">
          Variable
        </span>
      </div>
      <textarea
        data-var-key="${key}"
        rows="2"
        name="var-${key}"
        autocomplete="off"
        spellcheck="false"
        class="w-full px-3 py-2 rounded-2xl border border-md-outline-variant/70 dark:border-gray-700/80 bg-md-surface-container-highest/90 dark:bg-gray-800/80 text-md-surface-on dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-md-primary focus:border-md-primary resize-none overflow-hidden transition-colors duration-short-4"
        placeholder="Enter value for {{${key}}}"
      ></textarea>
    `;

    varsList.appendChild(wrap);

    const input = wrap.querySelector(`[data-var-key="${key}"]`);
    input.value = state.vars[key];

    input.addEventListener("input", () => {
      state.vars[key] = input.value;
      updateDerivedViews();
      debouncedSave();
    });

    wireAutoResize(input);
  });

  updateDerivedViews();
}

function updateChatbotButtons() {
  const filled = getFilledPrompt();
  const encoded = encodeURIComponent(filled);
  const allBots = getAllChatbots();

  const buttons = chatbotButtons.querySelectorAll("[data-bot-name]");
  buttons.forEach((btn) => {
    const botName = btn.getAttribute("data-bot-name");
    const bot = allBots.find((b) => b.name === botName);
    if (!bot) return;

    if (bot.supportsQueryParam) {
      btn.href = bot.urlTemplate.replace("{{{s}}}", encoded);
    } else {
      btn.href = bot.urlTemplate;
    }
  });
}

function updateDerivedViews() {
  charCount.textContent = `${state.template.length} character${state.template.length === 1 ? "" : "s"}`;

  const varKeys = extractVariables(state.template);
  const filled = getFilledPrompt();
  filledPreview.value = filled;
  autoResizeTextarea(filledPreview);

  if (varKeys.length > 0) {
    const missing = countMissingVars(varKeys);
    if (missing > 0) {
      missingVarsHint.textContent = `${missing} variable${missing === 1 ? "" : "s"} not filled`;
      missingVarsHint.classList.remove("hidden");
    } else {
      missingVarsHint.classList.add("hidden");
    }
  } else {
    missingVarsHint.classList.add("hidden");
  }

  const hasPrompt = !!state.template.trim();
  copyFilledBtn.disabled = !hasPrompt;
  shareBtn.disabled = !hasPrompt;

  if (hasPrompt) {
    fabButton.classList.remove("hidden");
  } else {
    fabButton.classList.add("hidden");
  }

  updateChatbotButtons();
}

function setShareTab(tabName) {
  shareTabs.forEach((t) => {
    const isActive = t.dataset.tab === tabName;
    t.className = isActive
      ? "shareTab shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-label-lg font-medium bg-md-secondary-container text-md-secondary-on-container"
      : "shareTab shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-label-lg font-medium bg-md-surface-container-highest dark:bg-gray-700 text-md-surface-on dark:text-gray-100";
  });

  sharePanels.forEach((p) => p.classList.add("hidden"));
  const active = document.getElementById(`tab-${tabName}`);
  if (active) active.classList.remove("hidden");
}

function refreshShareModalPreviews() {
  const link = buildShareLink({
    includeVars: includeVarsInLink.checked,
    includeMeta: includeMetaInLink.checked,
    canonicalize: canonicalizeInLink.checked,
  });
  shareLinkInput.value = link;

  shareFilledPreview.value = getFilledPrompt();
  shareTemplatePreview.value = state.template;

  const lines = [];
  if (state.title.trim()) lines.push(`Title: ${state.title.trim()}`);
  if (state.tags.trim()) lines.push(`Tags: ${state.tags.trim()}`);
  if (state.notes.trim()) {
    lines.push("");
    lines.push("Notes:");
    lines.push(state.notes.trim());
  }
  lines.push("");
  lines.push("Prompt:");
  lines.push(getFilledPrompt());
  lines.push("");
  lines.push("Open in Prompt Launcher:");
  lines.push(link);

  shareMessagePreview.value = lines.join("\n");
}

function createChatbotButtons() {
  chatbotButtons.innerHTML = "";
  const visibleBots = getVisibleChatbots();

  if (hiddenChatbots.length > 0) {
    const notice = document.createElement("div");
    notice.className =
      "mb-1 rounded-[24px] border border-md-outline-variant/70 dark:border-gray-700/80 bg-md-surface-container/75 dark:bg-gray-800/45 px-4 py-3 flex items-center justify-between gap-3";
    notice.innerHTML = `
      <div class="min-w-0">
        <p class="text-title-md font-medium text-md-surface-on dark:text-white">
          ${hiddenChatbots.length} hidden chatbot${hiddenChatbots.length === 1 ? "" : "s"}
        </p>
        <p class="text-body-sm text-md-surface-on-variant dark:text-gray-400">
          Hidden chatbots stay out of your launcher until you bring them back.
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-full bg-md-surface-container-highest dark:bg-gray-700 px-3 py-2 text-label-lg font-medium text-md-surface-on dark:text-gray-100 hover:bg-md-surface-container-high dark:hover:bg-gray-600 transition-colors duration-short-4"
      >
        Show all
      </button>
    `;
    const restoreBtn = notice.querySelector("button");
    restoreBtn.addEventListener("click", () => {
      resetHiddenChatbots();
      createChatbotButtons();
      updateChatbotButtons();
      showToast("All chatbots restored");
    });
    chatbotButtons.appendChild(notice);
  }

  visibleBots.forEach((bot) => {
    const isCustom = customChatbots.includes(bot);

    const wrapper = document.createElement("div");
    wrapper.className = "relative group";

    const a = document.createElement("a");
    a.setAttribute("data-bot-name", bot.name);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = `group flex min-h-[60px] sm:min-h-[72px] items-center gap-3 rounded-[24px] border border-md-outline-variant/70 dark:border-gray-700/80 bg-md-surface-container-high/85 dark:bg-gray-700/45 px-3 py-2.5 sm:px-4 sm:py-3 pr-16 sm:pr-24 shadow-elevation-1 text-left w-full transition-all duration-short-4 ease-standard hover:border-md-primary hover:shadow-elevation-2 dark:hover:border-indigo-400`;
    a.innerHTML = `
      <span class="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-[18px] bg-md-primary-container text-xl sm:text-2xl">${bot.icon}</span>
      <span class="min-w-0 flex-1">
        <span class="block truncate font-medium text-md-surface-on dark:text-white text-base">${bot.name}</span>
        <span class="block text-body-sm text-md-surface-on-variant dark:text-gray-300">
          ${bot.supportsQueryParam ? "Auto-fills prompt" : "Copies first, then opens"}
        </span>
      </span>
    `;

    a.addEventListener("click", async (e) => {
      if (bot.supportsQueryParam) return;

      e.preventDefault();
      const ok = await copyToClipboard(getFilledPrompt());
      if (ok) showToast("Copied - paste into the chatbot");

      window.open(bot.urlTemplate, "_blank", "noopener,noreferrer");
    });

    wrapper.appendChild(a);

    if (isCustom) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 bg-md-error text-md-error-on rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-short-4 flex items-center justify-center text-xs font-bold shadow-elevation-2";
      deleteBtn.textContent = "×";
      deleteBtn.title = "Remove custom chatbot";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const customIndex = customChatbots.findIndex((entry) => entry.name === bot.name);
        if (customIndex < 0) return;
        const snapshot = { bot: { ...customChatbots[customIndex] }, index: customIndex };
        customChatbots.splice(customIndex, 1);
        showChatbot(bot.name);
        saveCustomChatbots();
        saveHiddenChatbots();
        createChatbotButtons();
        updateChatbotButtons();
        showUndoToast(`Removed ${bot.name}`, async () => {
          const insertAt = Math.min(snapshot.index, customChatbots.length);
          if (customChatbots.some((entry) => entry.name === snapshot.bot.name)) {
            return;
          }
          customChatbots.splice(insertAt, 0, snapshot.bot);
          saveCustomChatbots();
          createChatbotButtons();
          updateChatbotButtons();
          showToast(`Restored ${snapshot.bot.name}`);
        });
      });
      wrapper.appendChild(deleteBtn);
    }

    if (!isCustom) {
      const hideBtn = document.createElement("button");
      hideBtn.type = "button";
      hideBtn.className = "absolute top-3 right-3 rounded-full bg-md-primary-container px-3 py-1.5 text-label-sm font-medium text-md-primary-on-container shadow-elevation-1 transition-colors duration-short-4 hover:bg-md-primary-container/80";
      hideBtn.textContent = "Hide";
      hideBtn.setAttribute("aria-label", `Hide ${bot.name}`);
      hideBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        hideChatbot(bot.name);
        createChatbotButtons();
        updateChatbotButtons();
        showToast(`Hidden ${bot.name}`);
      });
      wrapper.appendChild(hideBtn);
    }

    chatbotButtons.appendChild(wrapper);
  });

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "flex min-h-[60px] sm:min-h-[72px] items-center gap-3 rounded-[24px] border-2 border-dashed border-md-outline-variant/80 dark:border-gray-600 bg-transparent px-3 py-2.5 sm:px-4 sm:py-3 text-left font-medium text-md-surface-on-variant dark:text-gray-400 transition-all duration-short-4 ease-standard hover:border-md-primary hover:text-md-primary dark:hover:border-indigo-400 dark:hover:text-indigo-400";
  addBtn.innerHTML = `
    <span class="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-[18px] border border-dashed border-current text-xl">+</span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-md-surface-on dark:text-gray-100">Add Custom</span>
      <span class="block text-body-sm">Create a personal chatbot shortcut</span>
    </span>
  `;
  addBtn.addEventListener("click", openCustomChatbotModal);
  chatbotButtons.appendChild(addBtn);
}

function openCustomChatbotModal() {
  customBotName.value = "";
  customBotIcon.value = "🤖";
  customBotUrl.value = "";
  customBotSupportsQuery.checked = false;
  openModal(customChatbotModal, { initialFocus: customBotName });
}

function closeCustomChatbotModalFn() {
  closeModal(customChatbotModal);
}

function openTemplateLibraryModal() {
  renderTemplateList();
  openModal(templateLibraryModal, { initialFocus: saveToLibraryBtn });
}

function closeTemplateLibraryModalFn() {
  closeModal(templateLibraryModal);
}

function renderTemplateList() {
  if (!templateList) return;
  templateList.innerHTML = "";

  if (savedTemplates.length === 0) {
    templateList.innerHTML = `
      <div class="text-center py-8 text-md-surface-on-variant dark:text-gray-400">
        <p class="text-body-lg">No saved templates yet</p>
        <p class="text-body-sm mt-1">Save your current prompt to the library using the button above</p>
      </div>
    `;
    return;
  }

  savedTemplates.forEach((template, index) => {
    const varKeys = extractVariables(template.template);
    const varCount = varKeys.length;
    const previewText = template.template.length > 100 ? template.template.substring(0, 100) + "…" : template.template;

    const item = document.createElement("div");
    item.className = "group p-4 bg-md-surface-container-high/80 dark:bg-gray-700/45 rounded-[24px] border border-md-outline-variant/70 dark:border-gray-700/80 hover:border-md-primary dark:hover:border-indigo-400 transition-colors duration-short-4 cursor-pointer shadow-elevation-1";
    item.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <h4 class="text-title-md font-medium text-md-surface-on dark:text-white truncate">
            ${template.title || "Untitled Template"}
          </h4>
          ${template.tags ? `<p class="text-label-sm text-md-primary dark:text-indigo-400 mt-0.5">${template.tags}</p>` : ""}
          <p class="text-body-sm text-md-surface-on-variant dark:text-gray-400 mt-1 line-clamp-2">${previewText}</p>
          <div class="flex items-center gap-3 mt-2 text-label-sm text-md-surface-on-variant dark:text-gray-500">
            <span>${varCount} variable${varCount !== 1 ? "s" : ""}</span>
            <span>•</span>
            <span>${new Date(template.savedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <button
          class="delete-template-btn opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-md-error hover:bg-md-error-container rounded-full transition-all duration-short-4"
          data-index="${index}"
          title="Delete template"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;

    item.addEventListener("click", (e) => {
      if (e.target.closest(".delete-template-btn")) return;
      loadTemplate(index);
    });

    const deleteBtn = item.querySelector(".delete-template-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTemplate(index);
    });

    templateList.appendChild(item);
  });
}

function saveCurrentTemplate() {
  if (!state.template.trim()) {
    showToast("No template to save");
    return;
  }

  const template = {
    id: Date.now().toString(),
    title: state.title || "Untitled",
    tags: state.tags,
    notes: state.notes,
    template: state.template,
    vars: { ...state.vars },
    savedAt: Date.now(),
  };

  savedTemplates.unshift(template);
  saveTemplates();
  renderTemplateList();
  showToast("Template saved to library");
}

function loadTemplate(index) {
  const template = savedTemplates[index];
  if (!template) return;

  state.title = template.title || "";
  state.tags = template.tags || "";
  state.notes = template.notes || "";
  state.template = template.template || "";
  state.vars = template.vars || {};

  titleInput.value = state.title;
  tagsInput.value = state.tags;
  notesInput.value = state.notes;
  promptInput.value = state.template;

  if (state.notes.trim()) {
    notesWrap.classList.remove("hidden");
    toggleNotes.textContent = "− Hide notes";
    toggleNotes.setAttribute("aria-expanded", "true");
  }

  const varKeys = extractVariables(state.template);
  renderVariables(varKeys);
  updateDerivedViews();
  debouncedSave();

  closeTemplateLibraryModalFn();
  showToast("Template loaded");
}

function deleteTemplate(index) {
  const template = savedTemplates[index];
  if (!template) return;

  const snapshot = { template: { ...template }, index };
  savedTemplates.splice(index, 1);
  saveTemplates();
  renderTemplateList();
  showUndoToast(`Deleted "${template.title || "Untitled"}"`, async () => {
    if (savedTemplates.some((entry) => entry.id === snapshot.template.id)) {
      return;
    }
    const insertAt = Math.min(snapshot.index, savedTemplates.length);
    savedTemplates.splice(insertAt, 0, snapshot.template);
    saveTemplates();
    renderTemplateList();
    showToast(`Restored "${snapshot.template.title || "Untitled"}"`);
  });
}

function exportTemplates() {
  const data = {
    version: 2,
    exportedAt: Date.now(),
    templates: savedTemplates,
    customChatbots: customChatbots,
    hiddenChatbots: hiddenChatbots,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt-launcher-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Backup exported");
}

function importTemplates(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.templates && Array.isArray(data.templates)) {
        const existingIds = new Set(savedTemplates.map((t) => t.id));
        const newTemplates = data.templates.filter((t) => !existingIds.has(t.id));
        savedTemplates = [...newTemplates, ...savedTemplates];
        saveTemplates();
      }

      if (data.customChatbots && Array.isArray(data.customChatbots)) {
        const existingNames = new Set(customChatbots.map((c) => c.name));
        const newChatbots = data.customChatbots.filter((c) => !existingNames.has(c.name));
        customChatbots = [...customChatbots, ...newChatbots];
        saveCustomChatbots();
        createChatbotButtons();
        updateChatbotButtons();
      }

      if (data.hiddenChatbots && Array.isArray(data.hiddenChatbots)) {
        const merged = new Set(hiddenChatbots);
        data.hiddenChatbots.forEach((name) => {
          if (name) merged.add(String(name));
        });
        hiddenChatbots = Array.from(merged);
        saveHiddenChatbots();
        createChatbotButtons();
        updateChatbotButtons();
      }

      renderTemplateList();
      showToast("Import successful");
    } catch (err) {
      showToast("Invalid backup file");
    }
  };
  reader.readAsText(file);
}

