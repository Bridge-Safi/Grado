import { useState, useEffect, useRef } from "react";
import { Music, Video, Play, Pause, Download, Loader2, AlertCircle, ChevronDown, ChevronUp, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MediaPlayerProps {
  type: "music" | "video";
  mediaId: number;
  prompt: string;
  title?: string;
  genre?: string;
  lyrics?: string;
}

type MediaStatus = "pending" | "done" | "error";

interface MediaPollResult {
  id: number;
  type: string;
  status: MediaStatus;
  error?: string;
  fileUrl?: string;
}

function friendlyError(raw: string | undefined, type: "music" | "video"): string {
  if (!raw) return type === "video" ? "Génération vidéo échouée." : "Génération audio échouée.";
  const lower = raw.toLowerCase();
  if (lower.includes("exhausted balance") || lower.includes("exhausted") || lower.includes("top up"))
    return "💳 Solde épuisé. Recharge le compte sur fal.ai pour continuer.";
  if (lower.includes("user is locked"))
    return "🔒 Compte verrouillé. Vérifie le solde sur fal.ai.";
  if (lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden"))
    return "🔑 Clé API invalide ou quota dépassé.";
  if (lower.includes("429") || lower.includes("rate limit"))
    return "⏳ Trop de requêtes. Réessaie dans quelques instants.";
  if (lower.includes("timeout") || lower.includes("timed out"))
    return "⏱️ La génération a pris trop de temps. Réessaie.";
  if (lower.includes("failed") || lower.includes("error"))
    return type === "video" ? "❌ Génération vidéo échouée. Réessaie." : "❌ Génération audio échouée. Réessaie.";
  return raw;
}

export function MediaPlayer({ type, mediaId, prompt, title, genre, lyrics }: MediaPlayerProps) {
  const [status, setStatus] = useState<MediaStatus>("pending");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Start elapsed timer
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/media/${mediaId}`);
        if (!res.ok) return;
        const data: MediaPollResult = await res.json();
        setStatus(data.status);
        if (data.status === "done" && data.fileUrl) {
          setFileUrl(data.fileUrl);
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        } else if (data.status === "error") {
          setError(friendlyError(data.error, type));
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mediaId]);

  const updateTime = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
    animFrameRef.current = requestAnimationFrame(updateTime);
  };

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateTime);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = `grado-${type}-${mediaId}.${type === "video" ? "mp4" : "mp3"}`;
    a.click();
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const songTitle = title || "Chanson générée";
  const songGenre = genre || "IA Music";

  // ─── VIDEO PLAYER ──────────────────────────────────────────────────────────
  if (type === "video") {
    return (
      <div className="mt-3 rounded-xl border border-[#2a2a38] overflow-hidden bg-[#000000]">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] border-b border-[#2a2a38]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <Video className="w-3.5 h-3.5 text-[#8888A8]" />
          <span className="text-[11px] text-[#8888A8] flex-1 truncate">{prompt.substring(0, 50)}</span>
        </div>
        <div className="relative bg-black min-h-[200px] flex items-center justify-center">
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
              <p className="text-red-400/80 text-xs text-center px-4">{error}</p>
            </div>
          )}
          {status === "done" && fileUrl && (
            <video src={fileUrl} controls className="w-full" style={{ maxHeight: 360 }} />
          )}
        </div>
        {status === "done" && fileUrl && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0A0A0A] border-t border-[#2a2a38]">
            <span className="text-[11px] text-[#8888A8] mr-auto">Vidéo générée par Grado</span>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-[#8888A8] hover:text-white text-xs px-2" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5" />Télécharger
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ─── MUSIC PLAYER (Suno-style) ─────────────────────────────────────────────
  return (
    <div className="mt-3 rounded-2xl border border-[#2a2a38] overflow-hidden bg-[#050505]">
      {/* Album cover + info header */}
      <div className="flex items-stretch gap-0">
        {/* Cover art */}
        <div className={cn(
          "w-[88px] shrink-0 flex items-center justify-center",
          "bg-gradient-to-br from-[#5B5BD6] via-[#7B3FB5] to-[#2D1F6E]",
          "relative overflow-hidden"
        )}>
          {/* Animated rings when playing */}
          {isPlaying && (
            <>
              <div className="absolute inset-0 rounded-none" style={{
                background: "radial-gradient(circle at 50% 50%, rgba(91,91,214,0.4) 0%, transparent 70%)",
                animation: "pulse 2s ease-in-out infinite"
              }} />
              <style>{`@keyframes pulse{0%,100%{opacity:0.4;transform:scale(0.95)}50%{opacity:1;transform:scale(1.05)}}`}</style>
            </>
          )}
          {status === "pending" ? (
            <div className="flex flex-col items-center gap-1.5">
              <Loader2 className="w-6 h-6 text-white/80 animate-spin" />
              <span className="text-[10px] text-white/70 font-mono tabular-nums">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
              </span>
            </div>
          ) : status === "error" ? (
            <AlertCircle className="w-6 h-6 text-red-400/70" />
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Music className="w-7 h-7 text-white/90" />
              {isPlaying && (
                <div className="flex items-end gap-[2px]">
                  {[3, 6, 4, 7, 5, 3, 6].map((h, i) => (
                    <div key={i} className="w-[2px] bg-white/70 rounded-full" style={{
                      height: `${h + Math.abs(Math.sin(Date.now() / 200 + i))}px`,
                      animation: `bar${i} ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                    }} />
                  ))}
                  <style>{[0,1,2,3,4,5,6].map(i=>`@keyframes bar${i}{from{height:2px}to{height:${8+i*2}px}}`).join('')}</style>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Song info */}
        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#E8E8F0] truncate leading-tight">
                {status === "pending"
                  ? `Composition en cours… ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`
                  : status === "error" ? "Génération échouée"
                  : songTitle}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-[#5B5BD6] font-medium bg-[#5B5BD6]/10 px-1.5 py-0.5 rounded-full border border-[#5B5BD6]/20">
                  {songGenre}
                </span>
                <span className="text-[10px] text-[#55556A]">Grado Music</span>
              </div>
            </div>

            {/* Play button */}
            {status === "done" && fileUrl && (
              <Button
                size="icon"
                className="w-9 h-9 rounded-full shrink-0 bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white shadow-[0_0_14px_rgba(91,91,214,0.5)]"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
            )}
          </div>

          {/* Error message */}
          {status === "error" && (
            <p className="text-[11px] text-red-400/80 mt-1">{error}</p>
          )}

          {/* Progress bar */}
          {status === "done" && fileUrl && (
            <div className="mt-2 space-y-1">
              <div
                className="h-1.5 rounded-full bg-[#2a2a38] cursor-pointer overflow-hidden"
                onClick={handleSeek}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5B5BD6] to-[#9B59B6] transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-[#55556A]">
                <span>{fmt(currentTime)}</span>
                <span>{duration ? fmt(duration) : "--:--"}</span>
              </div>
            </div>
          )}

          {/* Pending progress */}
          {status === "pending" && (
            <div className="mt-2 h-1.5 rounded-full bg-[#2a2a38] overflow-hidden">
              <div className="h-full bg-[#5B5BD6]/50 rounded-full animate-pulse" style={{ width: "55%" }} />
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      {status === "done" && fileUrl && (
        <div className="flex items-center gap-1 px-3 py-2 bg-[#0e0e16] border-t border-[#1e1e2a]">
          {lyrics && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-[#8888A8] hover:text-white text-[11px] px-2"
              onClick={() => setShowLyrics(!showLyrics)}
            >
              <Mic2 className="w-3.5 h-3.5" />
              Paroles
              {showLyrics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-[#8888A8] hover:text-white text-[11px] px-2"
            onClick={handleDownload}
          >
            <Download className="w-3.5 h-3.5" />
            MP3
          </Button>
        </div>
      )}

      {/* Lyrics panel */}
      {showLyrics && lyrics && (
        <div className="px-4 py-4 bg-[#000000] border-t border-[#1e1e2a]">
          <pre className="text-[12px] text-[#A0A0C0] leading-relaxed whitespace-pre-wrap font-sans">
            {lyrics}
          </pre>
        </div>
      )}

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
