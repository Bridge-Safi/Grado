import { useState } from "react";
import { Download, Globe, ExternalLink, CheckCheck } from "lucide-react";
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

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grado-project.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    if (publishedUrl) {
      // Copy URL to clipboard
      const full = `${window.location.origin}${publishedUrl}`;
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, htmlContent: html }),
      });
      const data = await res.json();
      setPublishedUrl(data.previewUrl);
      const full = `${window.location.origin}${data.previewUrl}`;
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Publish failed", e);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-[#2a2a38] overflow-hidden bg-[#0D0D12]">
      {/* Preview bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#18181f] border-b border-[#2a2a38]">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 mx-2 bg-[#0D0D12] rounded-md px-3 py-0.5 text-[11px] text-[#8888A8] font-mono truncate border border-[#2a2a38]">
          {publishedUrl
            ? `${window.location.origin}${publishedUrl}`
            : "grado://preview"}
        </div>
        {publishedUrl && (
          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8888A8] hover:text-white transition-colors"
          >
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

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#18181f] border-t border-[#2a2a38]">
        <span className="text-[11px] text-[#8888A8] mr-auto">
          Projet construit par Grado Agent
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-[#8888A8] hover:text-white text-xs px-2"
          onClick={handleDownload}
          data-testid="button-download"
        >
          <Download className="w-3.5 h-3.5" />
          Télécharger
        </Button>
        <Button
          size="sm"
          className={cn(
            "h-7 gap-1.5 text-xs px-3 transition-all",
            publishedUrl
              ? "bg-green-600 hover:bg-green-500 text-white"
              : "bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white shadow-[0_0_10px_rgba(91,91,214,0.4)]"
          )}
          onClick={handlePublish}
          disabled={isPublishing}
          data-testid="button-publish"
        >
          {copied ? (
            <><CheckCheck className="w-3.5 h-3.5" /> Lien copié !</>
          ) : publishedUrl ? (
            <><Globe className="w-3.5 h-3.5" /> Copier le lien</>
          ) : (
            <><Globe className="w-3.5 h-3.5" />{isPublishing ? "Publication..." : "Publier"}</>
          )}
        </Button>
      </div>
    </div>
  );
}
