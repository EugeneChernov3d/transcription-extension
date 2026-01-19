import { transcribeAudio } from '~/utils/audioRecorder';

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // Handle transcription requests from content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'transcribe-audio' && message.audioData) {
      console.log('Received transcribe-audio message, sender:', sender.tab?.id);

      // Convert base64 back to blob
      fetch(message.audioData)
        .then(res => res.blob())
        .then(async (audioBlob) => {
          console.log('Audio blob converted, size:', audioBlob.size);
          const transcribedText = await transcribeAudio(audioBlob);
          console.log('Transcribed text:', transcribedText);
          // Send result back to content script
          if (sender.tab?.id) {
            browser.tabs.sendMessage(sender.tab.id, {
              action: 'transcription-complete',
              text: transcribedText,
            });
          }
        })
        .catch((error) => {
          console.error('Transcription error:', error);
          if (sender.tab?.id) {
            browser.tabs.sendMessage(sender.tab.id, {
              action: 'transcription-error',
              error: error instanceof Error ? error.message : 'Transcription failed',
            });
          }
        });

      // Return true to indicate async response
      return true;
    }
    return false;
  });

  // Create context menu on install
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'proofread-selection',
      title: 'Proofread selection',
      contexts: ['selection'],
    });

    browser.contextMenus.create({
      id: 'transcribe-to-input',
      title: 'Transcribe speech to input',
      contexts: ['editable'],
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

    if (info.menuItemId === 'transcribe-to-input' && tab?.id) {
      try {
        // Send message to content script to start transcription
        await browser.tabs.sendMessage(tab.id, { action: 'start-transcription' });
      } catch (error) {
        console.error('Error starting transcription:', error);
      }
    }
  });
});
