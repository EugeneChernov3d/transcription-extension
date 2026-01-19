export function insertTextAtCursor(text: string): boolean {
  const activeElement = document.activeElement;
  console.log('insertTextAtCursor called with text:', text);
  console.log('Active element:', activeElement);

  if (!activeElement) {
    console.log('No active element');
    return false;
  }

  // Handle input and textarea elements
  if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
    const element = activeElement;
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const currentValue = element.value;

    // Insert text at cursor position
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    element.value = newValue;

    // Set cursor position after inserted text
    const newPosition = start + text.length;
    element.setSelectionRange(newPosition, newPosition);

    // Trigger input event to ensure frameworks detect the change
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);

    return true;
  }

  // Handle contenteditable elements
  if (activeElement instanceof HTMLElement && activeElement.isContentEditable) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    // Create text node with transcribed text
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    // Move cursor after inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);

    // Trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    activeElement.dispatchEvent(inputEvent);

    return true;
  }

  return false;
}
