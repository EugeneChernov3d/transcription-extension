import { createRoot } from "react-dom/client";
import { useEffect, useRef } from "react";
import { useTranscriptionModal } from "~/hooks/use-transcription-modal";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { Kbd } from "./ui/kbd";
import "./TranscriptionModal.css";

interface TranscriptionModalProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export default function TranscriptionModal({
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

  //TODO: make it a separate custom hook that would manage hotkeys
  // Use ref to store the latest callbacks and state
  const onCloseRef = useRef(onClose);
  const handleStopAndInsertRef = useRef(handleStopAndInsert);
  const isRecordingStateRef = useRef(isRecordingState);
  const isProcessingRef = useRef(isProcessing);

  useEffect(() => {
    onCloseRef.current = onClose;
    handleStopAndInsertRef.current = handleStopAndInsert;
    isRecordingStateRef.current = isRecordingState;
    isProcessingRef.current = isProcessing;
  }, [onClose, handleStopAndInsert, isRecordingState, isProcessing]);

  // Handle keyboard shortcuts and custom events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modal
      if (e.code === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      // Ctrl+Space or Cmd+Space to stop and transcribe
    };

    const handleStopEvent = (e: Event) => {
      console.log("Received transcription-stop event");
      if (isRecordingStateRef.current && !isProcessingRef.current) {
        handleStopAndInsertRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("transcription-stop", handleStopEvent);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("transcription-stop", handleStopEvent);
    };
  }, []);

  return (
    <div className="transcription-modal-overlay">
      <div className="transcription-modal" onClick={(e) => e.stopPropagation()}>
        <div className="transcription-visualizer">
          <div className="waveform-container">
            <LiveWaveform
              active={isRecordingState}
              processing={isProcessing}
              barWidth={4}
              barHeight={4}
              barGap={3}
              barColor="rgba(255, 255, 255, 0.9)"
              height={120}
              fadeEdges={true}
              mode="static"
            />
          </div>
        </div>

        <div className="transcription-controls">
          <div className="control-group left">
            <div className="status-indicator">
              <div
                className={`status-dot ${isRecordingState ? "recording" : ""}`}
              />
              <span className="status-text">
                {isRecordingState ? "Voice" : "Paused"}
              </span>
            </div>
            <Kbd>⌃ ⇧ Z</Kbd>
          </div>

          <div className="control-group right">
            <button
              className="control-btn primary"
              onClick={handleStopAndInsert}
              disabled={!isRecordingState || isProcessing}
            >
              Stop
            </button>
            <Kbd>⌥ ⌘ ⌃ 0</Kbd>

            <div className="divider" />

            <button className="control-btn" onClick={onClose}>
              Cancel
            </button>
            <Kbd>Esc</Kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
