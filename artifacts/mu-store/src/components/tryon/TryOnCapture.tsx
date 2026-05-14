import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  productName: string;
}

export default function TryOnCapture({ canvasRef, productName }: Props) {
  const slug = productName.toLowerCase().replace(/\s+/g, "-");

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tryon-${slug}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Photo saved!");
    }, "image/png");
  };

  const share = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async blob => {
      if (!blob) { download(); return; }
      const file = new File([blob], `tryon-${slug}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: `My MU Try-On: ${productName}`, files: [file] });
          return;
        } catch { /* user cancelled */ }
      }
      download();
    }, "image/png");
  };

  return (
    <div className="flex gap-2">
      <button onClick={download}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors backdrop-blur-sm">
        <Download size={14} /> Save
      </button>
      <button onClick={share}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors backdrop-blur-sm">
        <Share2 size={14} /> Share
      </button>
    </div>
  );
}
