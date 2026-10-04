/**
 * MAIN ENTRY POINT & EVENT WIRING
 */

// Initial theme check (prevents flash)
(function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") document.documentElement.classList.add("dark");
})();

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize element references
  initElements();

  /**
   * Main initialization function
   */
  function init() {
    updateThemeIcons();

    // Load custom chatbots and templates from localStorage
    loadCustomChatbots();
    loadHiddenChatbots();
    loadTemplates();

    // Render initial chatbot buttons
    createChatbotButtons();

    // Priority: URL payload > localStorage
    const loadedFromUrl = tryLoadFromUrl();

    if (loadedFromUrl) {
      // Loaded from URL - populate UI
      titleInput.value = state.title;
      tagsInput.value = state.tags;

      if (state.notes.trim()) {
        notesWrap.classList.remove("hidden");
        toggleNotes.textContent = "− Hide notes";
        toggleNotes.setAttribute("aria-expanded", "true");
      }
      notesInput.value = state.notes;

      promptInput.value = state.template;

      const varKeys = extractVariables(state.template);
      renderVariables(varKeys);
      updateDerivedViews();

      // Save URL state to localStorage for persistence
      debouncedSave();

      showToast("Loaded from link");
    } else {
      // Try loading from localStorage
      const loadedFromStorage = loadStateFromStorage();

      if (loadedFromStorage && state.template.trim()) {
        // Loaded from localStorage - populate UI
        titleInput.value = state.title;
        tagsInput.value = state.tags;

        if (state.notes.trim()) {
          notesWrap.classList.remove("hidden");
          toggleNotes.textContent = "− Hide notes";
          toggleNotes.setAttribute("aria-expanded", "true");
        }
        notesInput.value = state.notes;

        promptInput.value = state.template;

        const varKeys = extractVariables(state.template);
        renderVariables(varKeys);
        updateDerivedViews();

        showToast("Restored from last session");
      } else {
        // Fresh start
        updateDerivedViews();
        promptInput.focus();
      }
    }
  }

  function clearDraft() {
    state.title = "";
    state.tags = "";
    state.notes = "";
    state.template = "";
    state.vars = {};

    titleInput.value = "";
    tagsInput.value = "";
    notesInput.value = "";
    promptInput.value = "";

    varsSection.classList.add("hidden");
    varsList.innerHTML = "";
    filledPreview.value = "";
    notesWrap.classList.add("hidden");
    toggleNotes.textContent = "+ Add notes";
    toggleNotes.setAttribute("aria-expanded", "false");
    updateDerivedViews();

    clearStorage();
    showToast("Draft cleared");
    promptInput.focus();
  }

  // --- EVENT LISTENERS ---

  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeIcons();
  });

  toggleNotes.addEventListener("click", () => {
    const isHidden = notesWrap.classList.toggle("hidden");
    toggleNotes.textContent = isHidden ? "+ Add notes" : "− Hide notes";
    toggleNotes.setAttribute("aria-expanded", String(!isHidden));
  });

  promptInput.addEventListener("input", () => {
    state.template = promptInput.value;

    const varKeys = extractVariables(state.template);
    renderVariables(varKeys);
    updateDerivedViews();
    debouncedSave();
  });

  titleInput.addEventListener("input", () => {
    state.title = titleInput.value;
    debouncedSave();
  });

  tagsInput.addEventListener("input", () => {
    state.tags = tagsInput.value;
    debouncedSave();
  });

  notesInput.addEventListener("input", () => {
    state.notes = notesInput.value;
    debouncedSave();
  });

  resetVarsBtn.addEventListener("click", () => {
    Object.keys(state.vars).forEach((k) => (state.vars[k] = ""));
    const varKeys = extractVariables(state.template);
    renderVariables(varKeys);
    updateDerivedViews();
    debouncedSave();
    showToast("Variables reset");
  });

  toggleFilledPreview.addEventListener("click", () => {
    const isHidden = filledPreviewWrapper.classList.toggle("hidden");
    toggleFilledPreview.setAttribute("aria-expanded", String(!isHidden));
    if (!isHidden) {
      // Rotates chevron to point up
      previewChevron.style.transform = "rotate(180deg)";
      // Ensure textarea resizes correctly since it was hidden
      autoResizeTextarea(filledPreview);
    } else {
      // Rotates chevron to point down
      previewChevron.style.transform = "rotate(0deg)";
    }
  });

  copyFilledBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(getFilledPrompt());
    if (ok) showToast("Filled prompt copied");
  });

  // FAB click handler
  fabButton.addEventListener("click", async () => {
    const ok = await copyToClipboard(getFilledPrompt());
    if (ok) showToast("Copied to clipboard");
  });

  const clearTriggers = [clearBtn, ...(clearDraftTriggers || [])].filter(Boolean);
  clearTriggers.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!clearConfirmModal) {
        clearDraft();
        return;
      }

      openModal(clearConfirmModal, { initialFocus: cancelClearBtn });
    });
  });

  // Share modal open/close
  shareBtn.addEventListener("click", () => {
    refreshShareModalPreviews();
    setShareTab("link");

    // Show/hide native share button based on support
    if (supportsNativeShare()) {
      nativeShareWrapper.classList.remove("hidden");
    } else {
      nativeShareWrapper.classList.add("hidden");
    }

    openModal(shareModal, { initialFocus: shareLinkInput });
    window.setTimeout(() => {
      if (shareLinkInput) {
        shareLinkInput.focus();
        shareLinkInput.select();
      }
    }, 0);
  });

  closeShareModal.addEventListener("click", () => {
    closeModal(shareModal);
  });

  shareModal.addEventListener("click", (e) => {
    if (e.target === shareModal) {
      closeModal(shareModal);
    }
  });

  shareTabs.forEach((t) => {
    t.addEventListener("click", () => {
      setShareTab(t.dataset.tab);
    });
  });

  includeVarsInLink.addEventListener("change", refreshShareModalPreviews);
  includeMetaInLink.addEventListener("change", refreshShareModalPreviews);
  canonicalizeInLink.addEventListener("change", refreshShareModalPreviews);

  copyLinkBtn.addEventListener("click", async () => {
    refreshShareModalPreviews();
    const ok = await copyToClipboard(shareLinkInput.value);
    if (ok) showToast("Share link copied");
  });

  // Native Share API button
  nativeShareBtn.addEventListener("click", async () => {
    refreshShareModalPreviews();
    const url = shareLinkInput.value;
    const title = state.title.trim() || "AI Prompt";
    const text = state.notes.trim()
      ? `${title}\n\n${state.notes.trim()}`
      : title;

    const shared = await triggerNativeShare(url, title, text);
    if (shared) {
      showToast("Shared successfully");
    }
  });

  copyFilledFromModalBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(getFilledPrompt());
    if (ok) showToast("Filled prompt copied");
  });

  copyTemplateBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(state.template);
    if (ok) showToast("Template copied");
  });

  copyMessageBtn.addEventListener("click", async () => {
    refreshShareModalPreviews();
    const ok = await copyToClipboard(shareMessagePreview.value);
    if (ok) showToast("Message copied");
  });

  // Custom chatbot modal wiring
  if (closeCustomChatbotModal) {
    closeCustomChatbotModal.addEventListener("click", closeCustomChatbotModalFn);
  }

  if (customChatbotModal) {
    customChatbotModal.addEventListener("click", (e) => {
      if (e.target === customChatbotModal) closeCustomChatbotModalFn();
    });
  }

  if (saveCustomChatbotBtn) {
    saveCustomChatbotBtn.addEventListener("click", () => {
      const name = customBotName.value.trim();
      const icon = customBotIcon.value.trim() || "🤖";
      let url = customBotUrl.value.trim();
      const supportsQuery = customBotSupportsQuery.checked;

      if (!name) {
        showToast("Please enter a name");
        return;
      }
      if (!url) {
        showToast("Please enter a URL");
        return;
      }

      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      if (supportsQuery && !url.includes("{{{s}}}")) {
        url = url.includes("?") ? url + "&q={{{s}}}" : url + "?q={{{s}}}";
      }

      const newBot = {
        name,
        icon,
        urlTemplate: url,
        supportsQueryParam: supportsQuery,
      };

      customChatbots.push(newBot);
      saveCustomChatbots();
      createChatbotButtons();
      updateChatbotButtons();
      closeCustomChatbotModalFn();
      showToast(`Added ${name}`);
    });
  }

  // Template library wiring
  const templateLibraryTriggersAll = [templateLibraryBtn, ...(templateLibraryTriggers || [])].filter(Boolean);
  templateLibraryTriggersAll.forEach((btn) => {
    btn.addEventListener("click", openTemplateLibraryModal);
  });

  if (closeTemplateLibrary) {
    closeTemplateLibrary.addEventListener("click", closeTemplateLibraryModalFn);
  }

  if (templateLibraryModal) {
    templateLibraryModal.addEventListener("click", (e) => {
      if (e.target === templateLibraryModal) closeTemplateLibraryModalFn();
    });
  }

  if (closeClearConfirmModal) {
    closeClearConfirmModal.addEventListener("click", () => closeModal(clearConfirmModal));
  }

  if (cancelClearBtn) {
    cancelClearBtn.addEventListener("click", () => closeModal(clearConfirmModal));
  }

  if (clearConfirmModal) {
    clearConfirmModal.addEventListener("click", (e) => {
      if (e.target === clearConfirmModal) closeModal(clearConfirmModal);
    });
  }

  if (confirmClearBtn) {
    confirmClearBtn.addEventListener("click", () => {
      closeModal(clearConfirmModal, { restoreFocus: false });
      clearDraft();
    });
  }

  if (saveToLibraryBtn) {
    saveToLibraryBtn.addEventListener("click", saveCurrentTemplate);
  }

  if (exportTemplatesBtn) {
    exportTemplatesBtn.addEventListener("click", exportTemplates);
  }

  if (importTemplatesBtn && importTemplatesInput) {
    importTemplatesBtn.addEventListener("click", () =>
      importTemplatesInput.click(),
    );
    importTemplatesInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        importTemplates(file);
        importTemplatesInput.value = "";
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (getOpenModal()) {
      trapModalFocus(e);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!copyFilledBtn.disabled) copyFilledBtn.click();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      clearBtn.click();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      openTemplateLibraryModal();
    }
  });

  // BOOTSTRAP APP
  init();
});

