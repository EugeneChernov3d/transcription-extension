import { CachedSelectionInfo, SelectionSnapshot } from "./types";

let cachedSelectionInfo: CachedSelectionInfo | null = null;

/**
 * Gets the currently selected text and caches selection information for later replacement.
 * Works with input/textarea elements, contenteditable elements, and regular page text.
 */
export function getSelectionText(): SelectionSnapshot {
  const selection = window.getSelection();
  const selectedText = selection?.toString() ?? "";

  // Cache the selection info for later replacement
  const activeElement = document.activeElement;

  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    // For input and textarea elements
    cachedSelectionInfo = {
      element: activeElement,
      selectionStart: activeElement.selectionStart ?? 0,
      selectionEnd: activeElement.selectionEnd ?? 0,
      currentValue: activeElement.value,
    };

    return {
      selectedText,
      contextText: activeElement.value,
      sourceType: "input-textarea",
    };
  } else {
    // For contenteditable elements and regular page text
    try {
      const range = selection?.getRangeAt(0);
      if (range) {
        cachedSelectionInfo = { element: range };
      }
    } catch (e) {
      console.error("Could not get selection range:", e);
    }
  }

  return {
    selectedText,
    contextText: selectedText,
    sourceType: "dom-selection",
  };
}

/**
 * Returns the cached selection info and clears the cache.
 */
export function getCachedSelectionInfo(): CachedSelectionInfo | null {
  const info = cachedSelectionInfo;
  cachedSelectionInfo = null;
  return info;
}
