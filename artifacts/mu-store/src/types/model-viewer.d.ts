import type React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean | "";
        "ar-modes"?: string;
        "camera-controls"?: boolean | "";
        "auto-rotate"?: boolean | "";
        "shadow-intensity"?: string;
        "environment-image"?: string;
        exposure?: string;
        poster?: string;
        loading?: string;
        reveal?: string;
        ref?: React.Ref<HTMLElement>;
      };
    }
  }
}

export {};
