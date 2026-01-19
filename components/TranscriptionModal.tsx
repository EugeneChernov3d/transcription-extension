import { createRoot } from "react-dom/client";
import { useTranscriptionModal } from "~/hooks/use-transcription-modal";

interface TranscriptionModalProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

function TranscriptionModal({
  onTranscriptionComplete,
  onError,
  onClose,
}: TranscriptionModalProps) {
  const [
    { isRecordingState, isProcessing, statusText },
    { handleToggleRecording, handleStopAndInsert },
  ] = useTranscriptionModal({
    onTranscriptionComplete,
    onError,
    onClose,
  });

  return (
    <div className="transcription-modal-overlay" onClick={onClose}>
      <div className="transcription-modal" onClick={(e) => e.stopPropagation()}>
        <div className="transcription-header">
          <h2>Speech to Text</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="transcription-content">
          <div className="recording-status">
            <div
              className={`recording-dot ${isRecordingState ? "recording" : ""}`}
            />
            <span>{statusText}</span>
          </div>
          <button
            className={`record-btn ${isRecordingState ? "recording" : ""}`}
            onClick={handleToggleRecording}
            disabled={isProcessing}
          >
            <span className="record-btn-icon">
              {isRecordingState ? "🔴" : "🎤"}
            </span>
            <span className="record-btn-text">
              {isProcessing
                ? "Processing..."
                : isRecordingState
                  ? "Recording..."
                  : "Start Recording"}
            </span>
          </button>
          <button
            className="stop-insert-btn"
            onClick={handleStopAndInsert}
            disabled={!isRecordingState || isProcessing}
          >
            ⏹️ Stop & Insert
          </button>
        </div>
      </div>
    </div>
  );
}

let modalRoot: HTMLElement | null = null;
let reactRoot: ReturnType<typeof createRoot> | null = null;

export function showTranscriptionModal(
  onTranscriptionComplete: (text: string) => void,
  onError: (error: string) => void,
) {
  // Create container if it doesn't exist
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "transcription-modal-root";
    document.body.appendChild(modalRoot);
  }

  // Create React root and render modal
  if (!reactRoot) {
    reactRoot = createRoot(modalRoot);
  }

  const handleClose = () => {
    // Unmount the modal and remove container
    if (reactRoot) {
      reactRoot.unmount();
      reactRoot = null;
    }
    if (modalRoot && modalRoot.parentNode) {
      modalRoot.parentNode.removeChild(modalRoot);
    }
    modalRoot = null;
  };

  reactRoot.render(
    <TranscriptionModal
      onTranscriptionComplete={onTranscriptionComplete}
      onError={onError}
      onClose={handleClose}
    />,
  );
}
