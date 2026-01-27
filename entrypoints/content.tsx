import { getSelectionText } from "~/utils/getSelectionText";
import { replaceText } from "~/utils/replaceText";
import "~/components/TranscriptionModal.css";

import { insertTextAtCursor } from "~/utils/insertText";
import ReactDOM from "react-dom/client";
// @ts-ignore
import TranscriptionModal from "@/components/TranscriptionModal";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    let ui: any = null; // Store UI instance

    browser.runtime.onMessage.addListener(
      async (message, sender, sendResponse) => {
        console.log(
          "Content script received message:",
          message.action,
          message,
        );

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
          console.log(
            "Transcription complete in content script:",
            message.text,
          );
          // Let the modal handle this
          return false;
        }

        if (message.action === "transcription-error") {
          console.log("Transcription error in content script:", message.error);
          // Let the modal handle this
          return false;
        }

        if (message.action === "start-transcription") {
          // If UI already exists, we ignore the global command to avoid conflict with
          // the component's internal handling of Ctrl+Space (which stops/inserts).
          if (ui) {
            console.log(
              "Transcription modal already open, stopping existing recording",
            );
            document.dispatchEvent(new CustomEvent("transcription-stop"));
            return false;
          }

          // Store the currently focused element before showing modal
          const targetElement = document.activeElement;
          console.log("Stored target element:", targetElement);

          ui = await createShadowRootUi(ctx, {
            name: "transcription-ui",
            position: "inline",
            anchor: "body",
            onMount: (container) => {
              const app = document.createElement("div");
              app.id = "transcription-modal-root";
              container.append(app);

              const root = ReactDOM.createRoot(app);
              root.render(
                <TranscriptionModal
                  onTranscriptionComplete={(text: string) => {
                    console.log(
                      "Transcription complete callback called with text:",
                      text,
                    );
                    if (targetElement instanceof HTMLElement) {
                      targetElement.focus();
                      console.log("Refocused element:", document.activeElement);
                    }
                    const success = insertTextAtCursor(text);
                    console.log("insertTextAtCursor result:", success);
                  }}
                  onError={(error: string) => {
                    alert(`Error: ${error}`);
                  }}
                  onClose={() => {
                    ui?.remove();
                    ui = null;
                  }}
                />,
              );
              return root;
            },
            onRemove: (root) => {
              root?.unmount();
            },
          });

          ui.mount();
          return false;
        }

        return false;
      },
    );
  },
});
