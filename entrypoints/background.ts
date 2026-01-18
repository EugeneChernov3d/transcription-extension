export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // Create context menu on install
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'proofread-selection',
      title: 'Proofread selection',
      contexts: ['selection'],
    });
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'proofread-selection' && tab?.id) {
      try {
        // Get selected text from content script
        const response = await browser.tabs.sendMessage(tab.id, { action: 'get-selection' });

        if (!response?.selectedText || response.selectedText.trim().length === 0) {
          await browser.tabs.sendMessage(tab.id, {
            action: 'proofread-error',
            error: 'Please select some text to proofread',
          });
          return;
        }

        // Call the proofreading API
        const apiResponse = await fetch('https://transcription-api-omega.vercel.app/api/proofread', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: response.selectedText }),
        });

        if (!apiResponse.ok) {
          throw new Error(`API returned status: ${apiResponse.status}`);
        }

        const result = await apiResponse.json();
        const proofreadText = result.proofreadText;

        if (!proofreadText) {
          throw new Error('No proofread text returned from API');
        }

        // Send proofread text back to content script
        await browser.tabs.sendMessage(tab.id, {
          action: 'proofread-complete',
          proofreadText,
        });
      } catch (error) {
        console.error('Error in background script:', error);
        if (tab?.id) {
          await browser.tabs.sendMessage(tab.id, {
            action: 'proofread-error',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        }
      }
    }
  });
});
