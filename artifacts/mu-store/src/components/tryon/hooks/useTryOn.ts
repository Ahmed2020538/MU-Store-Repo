import { useReducer, useCallback } from "react";

export type TryOnStep = "upload" | "generating" | "result";
export type TryOnStatus = "idle" | "starting" | "processing" | "completed" | "failed" | "demo";

export interface TryOnState {
  step: TryOnStep;
  userPhoto: File | null;
  userPhotoPreview: string | null;
  predictionId: string | null;
  provider: string | null;
  status: TryOnStatus;
  resultImageUrl: string | null;
  error: string | null;
  progress: number;
  generationCount: number;
}

type Action =
  | { type: "SET_PHOTO"; file: File; preview: string }
  | { type: "CLEAR_PHOTO" }
  | { type: "START_GENERATING"; predictionId: string; provider: string }
  | { type: "UPDATE_STATUS"; status: TryOnStatus; progress: number }
  | { type: "GENERATION_COMPLETE"; resultImageUrl: string }
  | { type: "GENERATION_FAILED"; error: string }
  | { type: "DEMO_MODE" }
  | { type: "RESET" };

function makeInitial(): TryOnState {
  let count = 0;
  try { count = parseInt(sessionStorage.getItem("mu_tryon_count") ?? "0"); } catch { /* ssr guard */ }
  return {
    step: "upload", userPhoto: null, userPhotoPreview: null,
    predictionId: null, provider: null, status: "idle",
    resultImageUrl: null, error: null, progress: 0, generationCount: count,
  };
}

function reducer(state: TryOnState, action: Action): TryOnState {
  switch (action.type) {
    case "SET_PHOTO":
      return { ...state, userPhoto: action.file, userPhotoPreview: action.preview, error: null };

    case "CLEAR_PHOTO":
      if (state.userPhotoPreview) URL.revokeObjectURL(state.userPhotoPreview);
      return { ...state, userPhoto: null, userPhotoPreview: null };

    case "START_GENERATING":
      return {
        ...state, step: "generating", predictionId: action.predictionId,
        provider: action.provider, status: "starting", progress: 5, error: null,
      };

    case "UPDATE_STATUS":
      return { ...state, status: action.status, progress: action.progress };

    case "GENERATION_COMPLETE": {
      const count = state.generationCount + 1;
      try { sessionStorage.setItem("mu_tryon_count", String(count)); } catch { /* ignore */ }
      return { ...state, step: "result", status: "completed", resultImageUrl: action.resultImageUrl, progress: 100, generationCount: count };
    }

    case "GENERATION_FAILED":
      return { ...state, step: "upload", status: "failed", error: action.error, progress: 0 };

    case "DEMO_MODE":
      return { ...state, step: "result", status: "demo", progress: 100 };

    case "RESET": {
      if (state.userPhotoPreview) URL.revokeObjectURL(state.userPhotoPreview);
      const count = state.generationCount;
      return { ...makeInitial(), generationCount: count };
    }

    default:
      return state;
  }
}

export function useTryOn() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitial);

  const setPhoto = useCallback((file: File) => {
    const preview = URL.createObjectURL(file);
    dispatch({ type: "SET_PHOTO", file, preview });
  }, []);

  const clearPhoto = useCallback(() => dispatch({ type: "CLEAR_PHOTO" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, dispatch, setPhoto, clearPhoto, reset };
}
