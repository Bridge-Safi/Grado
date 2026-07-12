import { Rocket, X, Loader2 } from "lucide-react";

interface PublishModalProps {
  title: string;
  setTitle: (v: string) => void;
  isPublishing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PublishModal({ title, setTitle, isPublishing, onClose, onConfirm }: PublishModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-[#050505] border border-[#2a2a38] rounded-2xl shadow-[0_0_60px_rgba(91,91,214,0.2)] w-full max-w-md p-6">
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
          <button onClick={onClose} className="text-[#8888A8] hover:text-white transition-colors">
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
            className="w-full bg-[#0A0A0A] border border-[#2a2a38] focus:border-[#5B5BD6]/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#555568] outline-none transition-colors"
            onKeyDown={(e) => e.key === "Enter" && onConfirm()}
            autoFocus
          />
        </div>

        {/* Preview of URL */}
        <div className="bg-[#000000] rounded-xl border border-[#2a2a38] px-3 py-2.5 mb-5">
          <p className="text-[10px] text-[#8888A8] mb-1">Ton site sera accessible à :</p>
          <p className="text-xs text-[#5B5BD6] font-mono truncate">
            {window.location.origin}/s/
            {title
              ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) + "-xxxxx"
              : "mon-site-xxxxx"}
          </p>
        </div>

        {/* Perks */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {["🌍 En ligne 24/7", "⚡ Hébergement gratuit", "🔗 Lien partageable"].map((p) => (
            <div key={p} className="text-center bg-[#0A0A0A] rounded-xl p-2.5 border border-[#2a2a38]">
              <p className="text-[11px] text-[#8888A8]">{p}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onConfirm}
          disabled={isPublishing}
          className="w-full py-3 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(91,91,214,0.4)]"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Publication en cours...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" /> Publier maintenant
            </>
          )}
        </button>
      </div>
    </div>
  );
}
