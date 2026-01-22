import { transcribeAudio } from "~/utils/audioRecorder";
import { proofreadSelection } from "~/utils/proofread";

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  // Handle transcription requests from content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "transcribe-audio" && message.audioData) {
      // todo refactor to async/await and use as a utilify function
      console.log("Received transcribe-audio message, sender:", sender.tab?.id);

      // Convert base64 back to blob
      fetch(message.audioData)
        .then((res) => res.blob())
        .then(async (audioBlob) => {
          console.log("Audio blob converted, size:", audioBlob.size);
          const transcribedText = await transcribeAudio(audioBlob);
          console.log("Transcribed text:", transcribedText);
          // Send result back to content script
          if (sender.tab?.id) {
            browser.tabs.sendMessage(sender.tab.id, {
              action: "transcription-complete",
              text: transcribedText,
            });
          }
        })
        .catch((error) => {
          console.error("Transcription error:", error);
          if (sender.tab?.id) {
            browser.tabs.sendMessage(sender.tab.id, {
              action: "transcription-error",
              error:
                error instanceof Error ? error.message : "Transcription failed",
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
      id: "proofread-selection",
      title: "Proofread selection",
      contexts: ["selection"],
    });

    browser.contextMenus.create({
      id: "transcribe-to-input",
      title: "Transcribe speech to input",
      contexts: ["editable"],
    });
  });

  // Handle keyboard commands
  browser.commands.onCommand.addListener(async (command, tab) => {
    if (command === "proofread-selection" && tab?.id) {
      try {
        await proofreadSelection(tab.id);
      } catch (error) {
        console.error("Error in proofread command:", error);
        if (tab?.id) {
          await browser.tabs.sendMessage(tab.id, {
            action: "proofread-error",
            error:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
        }
      }
    }

    if (command === "toggle-transcription" && tab?.id) {
      try {
        await browser.tabs.sendMessage(tab.id, {
          action: "start-transcription",
        });
      } catch (error) {
        console.error("Error opening transcription modal:", error);
      }
    }
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "proofread-selection" && tab?.id) {
      try {
        await proofreadSelection(tab.id);
      } catch (error) {
        console.error("Error in background script:", error);
        if (tab?.id) {
          await browser.tabs.sendMessage(tab.id, {
            action: "proofread-error",
            error:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
        }
      }
    }

    //TODO: this seems to be redandant with the line 80, explain.
    if (info.menuItemId === "transcribe-to-input" && tab?.id) {
      try {
        // Send message to content script to start transcription
        await browser.tabs.sendMessage(tab.id, {
          action: "start-transcription",
        });
      } catch (error) {
        console.error("Error starting transcription:", error);
      }
    }
  });
});
