import { useState } from "react";
import { Share2, Copy, Check, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  conversationId: number | null;
  token: string | null;
  label?: string;
  rtl?: boolean;
}

export function ShareButton({ conversationId, token, label = "Partager", rtl = false }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = slug ? `${window.location.origin}/share/${slug}` : "";

  const handleOpen = async () => {
    if (!conversationId || !token) return;
    setOpen(true);
    if (slug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${conversationId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setSlug(data.slug);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        disabled={!conversationId}
        title={label}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full",
          rtl && "flex-row-reverse text-right",
          conversationId
            ? "text-[#8888A8] hover:text-white hover:bg-[#ffffff08]"
            : "text-[#8888A8]/30 cursor-not-allowed"
        )}
      >
        <Share2 className="w-3.5 h-3.5 shrink-0" />
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-[10px] opacity-60">{rtl ? "مشاركة الرابط" : "Copier le lien"}</div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute bottom-full mb-2 bg-[#1a1a24] border border-[#2a2a38] rounded-xl p-3 z-50 w-72 shadow-xl",
              rtl ? "right-0" : "left-0"
            )}
          >
            <div className={cn("flex items-center justify-between mb-2", rtl && "flex-row-reverse")}>
              <span className="text-xs font-semibold text-white">
                {rtl ? "رابط المشاركة" : "Lien de partage"}
              </span>
              <button onClick={() => setOpen(false)} className="text-[#8888A8] hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="w-4 h-4 text-[#5B5BD6] animate-spin" />
              </div>
            ) : (
              <>
                <p className={cn("text-[10px] text-[#8888A8] mb-2", rtl && "text-right")}>
                  {rtl
                    ? "أي شخص لديه هذا الرابط يمكنه قراءة المحادثة."
                    : "Toute personne avec ce lien peut lire cette conversation."}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    dir="ltr"
                    className="flex-1 bg-[#0D0D12] border border-[#2a2a38] rounded-lg px-2 py-1.5 text-[11px] text-[#E8E8F0] focus:outline-none truncate"
                  />
                  <button
                    onClick={copy}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white text-xs font-medium transition-all shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? (rtl ? "تم!" : "Copié!") : (rtl ? "نسخ" : "Copier")}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
