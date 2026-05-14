import { useRef, useCallback } from "react";
import type { MutableRefObject, RefObject } from "react";

// MoveNet SinglePose keypoint indices
export const KP = {
  NOSE: 0, L_EYE: 1, R_EYE: 2, L_EAR: 3, R_EAR: 4,
  L_SHOULDER: 5, R_SHOULDER: 6, L_ELBOW: 7, R_ELBOW: 8,
  L_WRIST: 9, R_WRIST: 10, L_HIP: 11, R_HIP: 12,
  L_KNEE: 13, R_KNEE: 14, L_ANKLE: 15, R_ANKLE: 16,
} as const;

export interface Keypoint { x: number; y: number; score: number; }
export type Landmarks = Keypoint[] | null;

// Exponential moving average — smooths jitter
class EMA {
  private cache: Record<string, number> = {};
  smooth(k: string, v: number, a = 0.35): number {
    this.cache[k] = k in this.cache ? this.cache[k] * (1 - a) + v * a : v;
    return this.cache[k];
  }
  reset() { this.cache = {}; }
}

// Singleton detector — loaded once, reused across modal opens
let _detector: unknown = null;
let _loadPromise: Promise<unknown> | null = null;

async function loadDetector() {
  if (_detector) return _detector;
  if (_loadPromise) return _loadPromise;
  _loadPromise = (async () => {
    const tf = await import("@tensorflow/tfjs-core");
    await import("@tensorflow/tfjs-backend-webgl");
    await tf.ready();
    const pd = await import("@tensorflow-models/pose-detection");
    _detector = await pd.createDetector(
      pd.SupportedModels.MoveNet,
      { modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING },
    );
    return _detector;
  })();
  return _loadPromise;
}

export function usePoseDetection(
  videoRef: RefObject<HTMLVideoElement | null>,
  onLandmarks: (lm: Landmarks, tracking: boolean) => void,
) {
  const ema = useRef(new EMA());
  const rafRef = useRef(0);
  const activeRef = useRef(false);

  const loop = useCallback(async (det: any) => {
    if (!activeRef.current) return;
    const video = videoRef.current;

    if (!video || video.readyState < 2 || video.paused) {
      rafRef.current = window.setTimeout(() => loop(det), 100) as unknown as number;
      return;
    }

    try {
      const poses = await det.estimatePoses(video, { flipHorizontal: false });
      if (poses?.[0]?.keypoints?.length) {
        const kps: Keypoint[] = poses[0].keypoints.map((kp: any, i: number) => ({
          // Normalize to 0–1 so the overlay hook can scale to any canvas size
          x: ema.current.smooth(`x${i}`, kp.x / video.videoWidth),
          y: ema.current.smooth(`y${i}`, kp.y / video.videoHeight),
          score: kp.score ?? 0,
        }));
        const tracking = kps.some(k => k.score > 0.25);
        onLandmarks(tracking ? kps : null, tracking);
      } else {
        onLandmarks(null, false);
      }
    } catch {
      onLandmarks(null, false);
    }

    rafRef.current = requestAnimationFrame(() => loop(det));
  }, [videoRef, onLandmarks]);

  const start = useCallback(async () => {
    activeRef.current = true;
    ema.current.reset();
    const det = await loadDetector();
    loop(det);
  }, [loop]);

  const stop = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    clearTimeout(rafRef.current);
    onLandmarks(null, false);
  }, [onLandmarks]);

  return { start, stop };
}
