/**
 * Manages the custom selection styling for proofread text.
 */

let styleTag: HTMLStyleElement | null = null;
let selectionChangeListener: (() => void) | null = null;

const STYLE_ID = "transcription-extension-selection-style";

/**
 * Applies light green selection styling.
 * Removes automatically when selection is cleared or changed.
 */
export function applySelectionHighlight() {
  removeSelectionHighlight();

  styleTag = document.createElement("style");
  styleTag.id = STYLE_ID;
  styleTag.textContent = `
    ::selection {
      background-color: #D0F0D0 !important;
      color: black !important;
    }
    ::-moz-selection {
      background-color: #D0F0D0 !important;
      color: black !important;
    }
  `;
  document.head.appendChild(styleTag);

  const onSelectionChange = () => {
    if (!window.getSelection()?.toString()) {
      removeSelectionHighlight();
    }
  };

  document.addEventListener("selectionchange", onSelectionChange);
  selectionChangeListener = onSelectionChange;
}

/**
 * Removes the custom selection styling and cleans up listeners.
 */
export function removeSelectionHighlight() {
  styleTag?.remove();
  styleTag = null;

  if (selectionChangeListener) {
    document.removeEventListener("selectionchange", selectionChangeListener);
    selectionChangeListener = null;
  }
}
