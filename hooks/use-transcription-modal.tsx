import { useState, useEffect, useCallback } from "react";
import {
  startRecording,
  stopRecording,
  isRecording,
} from "~/utils/audioRecorder";

// Helper function to convert blob to base64 data URL
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface UseTranscriptionModalProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export interface TranscriptionModalState {
  isRecordingState: boolean;
  isProcessing: boolean;
  statusText: string;
}

export interface TranscriptionModalActions {
  handleToggleRecording: () => Promise<void>;
  handleStopAndInsert: () => Promise<void>;
}

/**
 * Custom hook for managing transcription modal state and logic.
 */
export function useTranscriptionModal({
  onTranscriptionComplete,
  onError,
  onClose,
}: UseTranscriptionModalProps): [
  TranscriptionModalState,
  TranscriptionModalActions,
] {
  const [isRecordingState, setIsRecordingState] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Ready to record");

  // Auto-start recording when modal opens
  useEffect(() => {
    let mounted = true;

    const autoStartRecording = async () => {
      try {
        await startRecording();
        if (mounted) {
          setIsRecordingState(true);
          setStatusText("Recording...");
        }
      } catch (error) {
        if (mounted) {
          onError(
            error instanceof Error && error.name === "NotAllowedError"
              ? "Microphone permission denied. Please allow microphone access and try again."
              : "Failed to start recording. Please check your microphone.",
          );
          onClose();
        }
      }
    };

    autoStartRecording();

    return () => {
      mounted = false;
      // Clean up recording if modal is unmounted
      if (isRecording()) {
        stopRecording().catch(() => {});
      }
    };
  }, [onError, onClose]);

  const processAudioTranscription = useCallback(
    async (audioBlob: Blob) => {
      try {
        // Convert blob to base64 and send to background script
        const audioDataUrl = await blobToBase64(audioBlob);
        console.log("Sending audio to background, size:", audioDataUrl.length);

        // Set up a one-time listener for the response
        const handleTranscriptionComplete = (message: any) => {
          console.log("Modal received message:", message);
          if (message.action === "transcription-complete") {
            browser.runtime.onMessage.removeListener(
              handleTranscriptionComplete,
            );
            onTranscriptionComplete(message.text);
            onClose();
          } else if (message.action === "transcription-error") {
            browser.runtime.onMessage.removeListener(
              handleTranscriptionComplete,
            );
            onError("Failed to transcribe audio. Please try again.");
            setIsProcessing(false);
            setStatusText("Transcription failed");
            setIsRecordingState(false);
          }
        };

        browser.runtime.onMessage.addListener(handleTranscriptionComplete);

        // Send to background script
        await browser.runtime.sendMessage({
          action: "transcribe-audio",
          audioData: audioDataUrl,
        });
        console.log("Message sent to background");
      } catch (error) {
        onError(
          "Failed to transcribe audio. Please make sure the transcription server is running on localhost:3000.",
        );
        setIsProcessing(false);
        setStatusText("Transcription failed");
        setIsRecordingState(false);
      }
    },
    [onTranscriptionComplete, onError, onClose],
  );

  const handleToggleRecording = useCallback(async () => {
    if (!isRecordingState) {
      try {
        await startRecording();
        setIsRecordingState(true);
        setStatusText("Recording...");
      } catch (error) {
        onError(
          error instanceof Error && error.name === "NotAllowedError"
            ? "Microphone permission denied. Please allow microphone access and try again."
            : "Failed to start recording. Please check your microphone.",
        );
      }
    } else {
      setIsProcessing(true);
      setStatusText("Processing...");
      const audioBlob = await stopRecording();
      setIsRecordingState(false);

      if (audioBlob) {
        await processAudioTranscription(audioBlob);
      }
    }
  }, [isRecordingState, onError, processAudioTranscription]);

  const handleStopAndInsert = useCallback(async () => {
    if (isRecording()) {
      setIsProcessing(true);
      setStatusText("Processing...");
      const audioBlob = await stopRecording();
      setIsRecordingState(false);

      if (audioBlob) {
        await processAudioTranscription(audioBlob);
      }
    }
  }, [onError, processAudioTranscription]);

  const state: TranscriptionModalState = {
    isRecordingState,
    isProcessing,
    statusText,
  };

  const actions: TranscriptionModalActions = {
    handleToggleRecording,
    handleStopAndInsert,
  };

  return [state, actions];
}
