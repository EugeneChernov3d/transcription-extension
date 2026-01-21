export type AudioRecorderState = {
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  stream: MediaStream | null;
};

let recorderState: AudioRecorderState = {
  mediaRecorder: null,
  audioChunks: [],
  stream: null,
};

export async function startRecording(): Promise<AudioRecorderState> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start();

    recorderState = {
      mediaRecorder,
      audioChunks,
      stream,
    };

    return recorderState;
  } catch (error) {
    console.error("Error starting recording:", error);
    throw error;
  }
}

export async function stopRecording(): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!recorderState.mediaRecorder) {
      resolve(null);
      return;
    }

    recorderState.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(recorderState.audioChunks, {
        type: "audio/wav",
      });

      // Stop all tracks to release the microphone
      if (recorderState.stream) {
        recorderState.stream.getTracks().forEach((track) => track.stop());
      }

      // Reset recorder state
      recorderState = {
        mediaRecorder: null,
        audioChunks: [],
        stream: null,
      };

      resolve(audioBlob);
    };

    recorderState.mediaRecorder.stop();
  });
}

export function isRecording(): boolean {
  return recorderState.mediaRecorder?.state === "recording";
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://transcription-api-omega.vercel.app';
  const API_KEY = import.meta.env.VITE_API_KEY;

  if (!API_KEY) {
    throw new Error('API key is missing. Please set VITE_API_KEY in your .env file.');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/transcribe`,
    {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(`Transcription API returned status: ${response.status}`);
  }

  const result = await response.json();
  return result.text;
}
