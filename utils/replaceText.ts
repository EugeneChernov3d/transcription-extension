import { getCachedSelectionInfo } from "./getSelectionText";

/**
 * Replaces the selected text with the provided proofread text.
 * Works with input/textarea elements, contenteditable elements, and regular page text.
 */
export function replaceText(proofreadText: string) {
  const cachedSelectionInfo = getCachedSelectionInfo();

  if (!cachedSelectionInfo) {
    console.error("No cached selection info available");
    alert("Selection was lost. Please try again.");
    return;
  }

  const { element } = cachedSelectionInfo;

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    // For input and textarea elements
    const start = cachedSelectionInfo.selectionStart ?? 0;
    const end = cachedSelectionInfo.selectionEnd ?? 0;
    const currentValue = cachedSelectionInfo.currentValue ?? "";

    console.log("Replacing in input/textarea:", { start, end });

    const newValue =
      currentValue.substring(0, start) +
      proofreadText +
      currentValue.substring(end);
    element.value = newValue;

    // Set cursor position after the replacement
    const newCursorPosition = start + proofreadText.length;
    element.setSelectionRange(newCursorPosition, newCursorPosition);

    // Trigger input event so the page knows the value changed
    element.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (element instanceof Range) {
    // For contenteditable elements and regular page text
    console.log("Replacing in content element");
    const selection = window.getSelection();

    element.deleteContents();
    element.insertNode(document.createTextNode(proofreadText));
    selection?.removeAllRanges();
    selection?.addRange(element);
  }

  console.log("Text proofread successfully!");
}
