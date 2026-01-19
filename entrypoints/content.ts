import { getSelectionText } from "~/utils/getSelectionText";
import { replaceText } from "~/utils/replaceText";
import "~/components/TranscriptionModal.css";
import { showTranscriptionModal } from "~/components/TranscriptionModal";
import { insertTextAtCursor } from "~/utils/insertText";

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message.action, message);

      if (message.action === "get-selection") {
        const selectedText = getSelectionText();
        sendResponse({ selectedText });
        return true;
      }

      if (message.action === "proofread-complete") {
        replaceText(message.proofreadText);
        return false;
      }

      if (message.action === "proofread-error") {
        alert(`Error: ${message.error}`);
        return false;
      }

      if (message.action === "transcription-complete") {
        console.log('Transcription complete in content script:', message.text);
        // Let the modal handle this
        return false;
      }

      if (message.action === "transcription-error") {
        console.log('Transcription error in content script:', message.error);
        // Let the modal handle this
        return false;
      }

      if (message.action === "start-transcription") {
        // Store the currently focused element before showing modal
        const targetElement = document.activeElement;
        console.log('Stored target element:', targetElement);

        showTranscriptionModal(
          (text) => {
            console.log('Transcription complete callback called with text:', text);
            // Refocus the target element before inserting
            if (targetElement instanceof HTMLElement) {
              targetElement.focus();
              console.log('Refocused element:', document.activeElement);
            }
            // Insert transcribed text at cursor position
            const success = insertTextAtCursor(text);
            console.log('insertTextAtCursor result:', success);
          },
          (error) => {
            alert(`Error: ${error}`);
          },
        );
        return false;
      }

      return false;
    });
  },
});
