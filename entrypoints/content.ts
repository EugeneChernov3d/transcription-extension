export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Hello content. Script loaded!');

    // Store selection info to use later when replacing text
    let cachedSelectionInfo: {
      element: HTMLInputElement | HTMLTextAreaElement | Range;
      selectionStart?: number;
      selectionEnd?: number;
      currentValue?: string;
    } | null = null;

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Received message:', message);

      if (message.action === 'get-selection') {
        // Get and cache selection info, then send selected text to background
        const selectedText = getSelectionText();
        sendResponse({ selectedText });
        return true;
      }

      if (message.action === 'proofread-complete') {
        // Replace the selected text with proofread version
        replaceText(message.proofreadText);
        return false;
      }

      if (message.action === 'proofread-error') {
        // Show error to user
        alert(`Error: ${message.error}`);
        return false;
      }

      return false;
    });

    function getSelectionText(): string {
      const selection = window.getSelection();
      const selectedText = selection?.toString() ?? '';

      // Cache the selection info for later replacement
      const activeElement = document.activeElement;

      if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
        // For input and textarea elements
        cachedSelectionInfo = {
          element: activeElement,
          selectionStart: activeElement.selectionStart ?? 0,
          selectionEnd: activeElement.selectionEnd ?? 0,
          currentValue: activeElement.value,
        };
      } else {
        // For contenteditable elements and regular page text
        try {
          const range = selection?.getRangeAt(0);
          if (range) {
            cachedSelectionInfo = { element: range };
          }
        } catch (e) {
          console.error('Could not get selection range:', e);
        }
      }

      return selectedText;
    }

    function replaceText(proofreadText: string) {
      if (!cachedSelectionInfo) {
        console.error('No cached selection info available');
        alert('Selection was lost. Please try again.');
        return;
      }

      const { element } = cachedSelectionInfo;

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        // For input and textarea elements
        const start = cachedSelectionInfo.selectionStart ?? 0;
        const end = cachedSelectionInfo.selectionEnd ?? 0;
        const currentValue = cachedSelectionInfo.currentValue ?? '';

        console.log('Replacing in input/textarea:', { start, end });

        const newValue = currentValue.substring(0, start) + proofreadText + currentValue.substring(end);
        element.value = newValue;

        // Set cursor position after the replacement
        const newCursorPosition = start + proofreadText.length;
        element.setSelectionRange(newCursorPosition, newCursorPosition);

        // Trigger input event so the page knows the value changed
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (element instanceof Range) {
        // For contenteditable elements and regular page text
        console.log('Replacing in content element');
        const selection = window.getSelection();

        element.deleteContents();
        element.insertNode(document.createTextNode(proofreadText));
        selection?.removeAllRanges();
        selection?.addRange(element);
      }

      console.log('Text proofread successfully!');
      cachedSelectionInfo = null;
    }
  },
});
