import { useState, useEffect, useRef } from "react";
import { Music, Video, Play, Pause, Download, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MediaPlayerProps {
  type: "music" | "video";
  mediaId: number;
  prompt: string;
}

type MediaStatus = "pending" | "done" | "error";

interface MediaPollResult {
  id: number;
  type: string;
  status: MediaStatus;
  error?: string;
  fileUrl?: string;
}

export function MediaPlayer({ type, mediaId, prompt }: MediaPlayerProps) {
  const [status, setStatus] = useState<MediaStatus>("pending");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/media/${mediaId}`);
        if (!res.ok) return;
        const data: MediaPollResult = await res.json();
        setStatus(data.status);
        if (data.status === "done" && data.fileUrl) {
          setFileUrl(data.fileUrl);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "error") {
          setError(data.error || "Génération échouée");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [mediaId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = `grado-${type}-${mediaId}.${type === "video" ? "mp4" : "mp3"}`;
    a.click();
  };

  if (type === "video") {
    return (
      <div className="mt-3 rounded-xl border border-[#2a2a38] overflow-hidden bg-[#0D0D12]">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#18181f] border-b border-[#2a2a38]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <Video className="w-3.5 h-3.5 text-[#8888A8]" />
          <span className="text-[11px] text-[#8888A8] font-mono truncate">
            {status === "pending" ? "Génération vidéo en cours..." : status === "done" ? "grado://video" : "Erreur"}
          </span>
        </div>

        <div className="relative bg-black" style={{ minHeight: 240 }}>
          {status === "pending" && (
            <div className="flex flex-col items-center justify-center gap-3 h-60">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-[#5B5BD6]/30 border-t-[#5B5BD6] animate-spin" />
                <Video className="w-5 h-5 text-[#5B5BD6] absolute inset-0 m-auto" />
              </div>
              <p className="text-[#8888A8] text-xs">Génération vidéo IA...</p>
              <p className="text-[#55556A] text-[10px] max-w-xs text-center px-4 truncate">"{prompt}"</p>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center gap-2 h-60">
              <AlertCircle className="w-8 h-8 text-red-400/60" />
              <p className="text-red-400/80 text-xs">{error}</p>
            </div>
          )}
          {status === "done" && fileUrl && (
            <video
              src={fileUrl}
              controls
              className="w-full"
              style={{ maxHeight: 360 }}
            />
          )}
        </div>

        {status === "done" && fileUrl && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#18181f] border-t border-[#2a2a38]">
            <span className="text-[11px] text-[#8888A8] mr-auto">Vidéo générée par Grado</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-[#8888A8] hover:text-white text-xs px-2"
              onClick={handleDownload}
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Music player
  return (
    <div className="mt-3 rounded-xl border border-[#2a2a38] overflow-hidden bg-[#18181f]">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Album art / waveform area */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
          "bg-gradient-to-br from-[#5B5BD6]/30 to-[#9B59B6]/30 border border-[#5B5BD6]/20"
        )}>
          {status === "pending" ? (
            <Loader2 className="w-5 h-5 text-[#5B5BD6] animate-spin" />
          ) : status === "error" ? (
            <AlertCircle className="w-5 h-5 text-red-400/60" />
          ) : (
            <Music className="w-5 h-5 text-[#5B5BD6]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#E8E8F0] truncate">
            {status === "pending" ? "Composition en cours..." : status === "error" ? "Échec de génération" : "Musique générée"}
          </p>
          <p className="text-[11px] text-[#55556A] truncate mt-0.5">
            {status === "error" ? error : `"${prompt.substring(0, 60)}${prompt.length > 60 ? "..." : ""}"`}
          </p>

          {/* Fake waveform when done */}
          {status === "done" && (
            <div className="flex items-end gap-[2px] mt-2 h-4">
              {Array.from({ length: 28 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-[2px] rounded-full transition-all duration-150",
                    isPlaying ? "bg-[#5B5BD6]" : "bg-[#5B5BD6]/40"
                  )}
                  style={{
                    height: `${Math.max(3, Math.abs(Math.sin(i * 0.8 + 1) * 14))}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Progress bar placeholder */}
          {status === "pending" && (
            <div className="mt-2 h-1 rounded-full bg-[#2a2a38] overflow-hidden">
              <div className="h-full bg-[#5B5BD6]/40 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {status === "done" && fileUrl && (
            <>
              <Button
                size="icon"
                className={cn(
                  "w-9 h-9 rounded-full",
                  "bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white shadow-[0_0_14px_rgba(91,91,214,0.4)]"
                )}
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-[#8888A8] hover:text-white"
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {fileUrl && (
        <audio
          ref={audioRef}
          src={fileUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}
    </div>
  );
}
