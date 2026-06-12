// hooks/useMediaRecorder.ts
// Hook untuk merekam HTMLCanvasElement menggunakan MediaRecorder API native browser.
// Tidak butuh FFmpeg, tidak butuh SharedArrayBuffer, zero external dependency.
// Output: WebM (VP9/VP8) yang didukung semua browser modern.

import { useRef, useState, useCallback } from "react";

export type RecordingState = "idle" | "recording" | "exporting";

interface UseMediaRecorderReturn {
  recordingState: RecordingState;
  progress: number; // 0–100
  startRecording: (canvas: HTMLCanvasElement, durationMs: number) => void;
  stopRecording: () => void;
}

export function useMediaRecorder(): UseMediaRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [progress, setProgress] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(
    (canvas: HTMLCanvasElement, durationMs: number) => {
      // Reset state
      chunksRef.current = [];
      setProgress(0);
      setRecordingState("recording");

      // Pilih codec terbaik yang tersedia
      const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";

      // Capture stream dari canvas pada 30fps
      const stream = canvas.captureStream(30);

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5_000_000, // 5 Mbps
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        setRecordingState("exporting");
        const blob = new Blob(chunksRef.current, { type: mimeType.split(";")[0] });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `kolio-motion-export.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setRecordingState("idle");
        setProgress(0);
      };

      // Kumpulkan data tiap 100ms agar tidak hilang saat stop
      recorder.start(100);

      // Progress timer
      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
        setProgress(pct);
        if (elapsed >= durationMs) {
          stopRecording();
        }
      }, 100);

      // Auto-stop setelah durasi
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
        if (timerRef.current) clearInterval(timerRef.current);
      }, durationMs);
    },
    [stopRecording],
  );

  return { recordingState, progress, startRecording, stopRecording };
}
