export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

      return false;
    });
  },
});
