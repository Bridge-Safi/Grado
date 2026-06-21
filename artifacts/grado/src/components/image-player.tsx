import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Maximize2, X, Loader2, ImageOff } from "lucide-react";

interface ImagePlayerProps {
  mediaId: number;
  prompt: string;
}

type Status = "pending" | "loading" | "done" | "error";

export function ImagePlayer({ mediaId, prompt }: ImagePlayerProps) {
  const [status, setStatus] = useState<Status>("pending");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    const poll = async () => {
      for (let i = 0; i < 60; i++) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/media/${mediaId}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          if (data.status === "done" && data.fileUrl) {
            if (!cancelled) {
              setImageUrl(data.fileUrl);
              setStatus("done");
            }
            return;
          }
          if (data.status === "error") {
            if (!cancelled) {
              setError(data.error || "Erreur de génération");
              setStatus("error");
            }
            return;
          }
        } catch { /* ignore, retry */ }
        await new Promise(r => setTimeout(r, 2000));
      }
      if (!cancelled) {
        setError("Délai dépassé");
        setStatus("error");
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [mediaId]);

  const download = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `grado-image-${mediaId}.webp`;
    a.click();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-2 rounded-2xl overflow-hidden border border-[#2a2a38] bg-[#050505] max-w-lg"
      >
        {/* Image area */}
        <div className="relative bg-[#0a0a10] min-h-[200px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {status === "loading" || status === "pending" ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-12"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-[#5B5BD6]/20 border-t-[#5B5BD6] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-lg">🎨</div>
                </div>
                <p className="text-xs text-[#8888A8]">Génération en cours…</p>
              </motion.div>
            ) : status === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2 py-12"
              >
                <ImageOff className="w-8 h-8 text-red-400/60" />
                <p className="text-xs text-red-400/80">{error}</p>
              </motion.div>
            ) : imageUrl ? (
              <motion.div
                key="image"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <img
                  src={imageUrl}
                  alt={prompt}
                  className="w-full object-cover cursor-zoom-in"
                  onClick={() => setLightbox(true)}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Top-right actions */}
          {status === "done" && imageUrl && (
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => setLightbox(true)}
                className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={download}
                className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Prompt caption */}
        <div className="px-4 py-2.5 border-t border-[#1e1e2a]">
          <p className="text-xs text-[#8888A8] line-clamp-2">🎨 {prompt}</p>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={() => setLightbox(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={imageUrl}
              alt={prompt}
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="text-sm text-white/60 max-w-lg mx-auto px-4">{prompt}</p>
              <button
                onClick={download}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
