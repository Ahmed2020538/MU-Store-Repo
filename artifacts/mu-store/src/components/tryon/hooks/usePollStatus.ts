import { useEffect, useRef, useCallback } from "react";

interface PollOptions {
  predictionId: string | null;
  enabled: boolean;
  interval?: number;
  maxDuration?: number;
  onStatus: (status: string, progress: number) => void;
  onComplete: (resultImageUrl: string) => void;
  onFailed: (error: string) => void;
  onTimeout: () => void;
}

export function usePollStatus({
  predictionId,
  enabled,
  interval = 2000,
  maxDuration = 90000,
  onStatus,
  onComplete,
  onFailed,
  onTimeout,
}: PollOptions) {
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(0);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!enabled || !predictionId) return;

    startRef.current = Date.now();
    abortRef.current = new AbortController();

    const poll = async () => {
      if (abortRef.current?.signal.aborted) return;
      if (Date.now() - startRef.current > maxDuration) { onTimeout(); return; }

      try {
        const res = await fetch(`/api/tryon/status/${predictionId}`, {
          signal: abortRef.current!.signal,
        });

        if (!res.ok) { onFailed("Status check failed. Please try again."); return; }

        const d = await res.json() as {
          status: string; progress: number;
          resultImageUrl: string | null; error: string | null;
        };

        if (d.status === "demo") return;

        onStatus(d.status, d.progress ?? 0);

        if (d.status === "completed" && d.resultImageUrl) { onComplete(d.resultImageUrl); return; }
        if (d.status === "failed") { onFailed(d.error ?? "Generation failed. Please try again."); return; }

        timerRef.current = setTimeout(poll, interval);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        timerRef.current = setTimeout(poll, interval * 2);
      }
    };

    poll();
    return stop;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, predictionId]);

  return { stop };
}
