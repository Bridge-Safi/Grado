import { useState } from "react";
import { Download, Globe, ExternalLink, CheckCheck, X, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProjectPreviewProps {
  html: string;
  conversationId: number;
}

export function ProjectPreview({ html, conversationId }: ProjectPreviewProps) {
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grado-project.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublishClick = () => {
    if (publishedUrl) {
      copyUrl(publishedUrl);
      return;
    }
    setShowModal(true);
  };

  const copyUrl = async (url: string) => {
    const full = `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleConfirmPublish = async () => {
    const token = localStorage.getItem("grado_token");
    setIsPublishing(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title: title || "Mon site Grado", htmlContent: html }),
      });
      const data = await res.json();
      const siteUrl = data.url;
      setPublishedUrl(siteUrl);
      setShowModal(false);
      await copyUrl(siteUrl);
    } catch (e) {
      console.error("Publish failed", e);
    } finally {
      setIsPublishing(false);
    }
  };

  const fullUrl = publishedUrl ? `${window.location.origin}${publishedUrl}` : null;

  return (
    <>
      <div className="mt-3 rounded-xl border border-[#2a2a38] overflow-hidden bg-[#050508]">
        {/* Preview bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0D0D15] border-b border-[#2a2a38]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 mx-2 bg-[#050508] rounded-md px-3 py-0.5 text-[11px] text-[#8888A8] font-mono truncate border border-[#2a2a38]">
            {fullUrl ?? "grado://preview"}
          </div>
          {fullUrl && (
            <a href={publishedUrl!} target="_blank" rel="noopener noreferrer"
              className="text-[#8888A8] hover:text-white transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Iframe */}
        <iframe
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          className="w-full border-0 bg-white"
          style={{ height: 420 }}
          title="Project Preview"
        />

        {/* Action bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0D0D15] border-t border-[#2a2a38]">
          <span className="text-[11px] text-[#8888A8] mr-auto">Projet construit par Grado Agent</span>
          <Button size="sm" variant="ghost"
            className="h-7 gap-1.5 text-[#8888A8] hover:text-white text-xs px-2"
            onClick={handleDownload} data-testid="button-download">
            <Download className="w-3.5 h-3.5" /> Télécharger
          </Button>
          <Button size="sm"
            className={cn(
              "h-7 gap-1.5 text-xs px-3 transition-all",
              publishedUrl
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white shadow-[0_0_10px_rgba(91,91,214,0.4)]"
            )}
            onClick={handlePublishClick}
            disabled={isPublishing}
            data-testid="button-publish">
            {copied ? (
              <><CheckCheck className="w-3.5 h-3.5" /> Lien copié !</>
            ) : publishedUrl ? (
              <><Globe className="w-3.5 h-3.5" /> Copier le lien</>
            ) : (
              <><Rocket className="w-3.5 h-3.5" /> Publier ce site</>
            )}
          </Button>
        </div>
      </div>

      {/* Publish modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
          <div className="bg-[#08080F] border border-[#2a2a38] rounded-2xl shadow-[0_0_60px_rgba(91,91,214,0.2)] w-full max-w-md p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5B5BD6]/15 border border-[#5B5BD6]/25 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-[#5B5BD6]" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Publier ce site</p>
                  <p className="text-[11px] text-[#8888A8]">Hébergé gratuitement sur Grado</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                className="text-[#8888A8] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title input */}
            <div className="mb-4">
              <label className="text-xs text-[#8888A8] mb-1.5 block">Nom du site</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mon projet Grado"
                className="w-full bg-[#0D0D15] border border-[#2a2a38] focus:border-[#5B5BD6]/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#555568] outline-none transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleConfirmPublish()}
                autoFocus
              />
            </div>

            {/* Preview of URL */}
            <div className="bg-[#050508] rounded-xl border border-[#2a2a38] px-3 py-2.5 mb-5">
              <p className="text-[10px] text-[#8888A8] mb-1">Ton site sera accessible à :</p>
              <p className="text-xs text-[#5B5BD6] font-mono truncate">
                {window.location.origin}/s/{title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) + "-xxxxx" : "mon-site-xxxxx"}
              </p>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {["🌍 En ligne 24/7", "⚡ Hébergement gratuit", "🔗 Lien partageable"].map(p => (
                <div key={p} className="text-center bg-[#0D0D15] rounded-xl p-2.5 border border-[#2a2a38]">
                  <p className="text-[11px] text-[#8888A8]">{p}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleConfirmPublish}
              disabled={isPublishing}
              className="w-full py-3 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(91,91,214,0.4)]">
              {isPublishing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Publication en cours...</>
                : <><Rocket className="w-4 h-4" /> Publier maintenant</>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
