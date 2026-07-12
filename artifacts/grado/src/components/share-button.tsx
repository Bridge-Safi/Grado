import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Share2, Copy, Check, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  conversationId: number | null;
  token: string | null;
  label?: string;
  rtl?: boolean;
  compact?: boolean;
  align?: "top" | "bottom";
}

export function ShareButton({ conversationId, token, label = "Partager", rtl = false, compact = false, align = "top" }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const shareUrl = slug ? `${window.location.origin}/share/${slug}` : "";

  const updatePos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos(
      align === "top"
        ? { top: r.top - 8, left: rtl ? r.right : r.left }
        : { top: r.bottom + 8, left: rtl ? r.right : r.left }
    );
  };

  const handleOpen = async () => {
    if (!conversationId || !token) return;
    updatePos();
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

  // Fermer si clic en dehors
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      const popup = document.getElementById("share-portal");
      if (popup?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const trigger = compact ? (
    <button
      ref={btnRef}
      onClick={handleOpen}
      disabled={!conversationId}
      title={label}
      className={cn(
        "flex items-center justify-center gap-1 text-[10px] font-semibold rounded-md px-2 py-1 border transition-colors shrink-0 whitespace-nowrap",
        conversationId
          ? "text-[#8888A8] hover:text-white border-[#1e1e2a] hover:border-[#5B5BD6]/40"
          : "text-[#8888A8]/30 border-[#1e1e2a] cursor-not-allowed"
      )}
      data-testid="button-share-preview"
    >
      <Share2 className="w-3 h-3 shrink-0" /> <span className="hidden xl:inline">{label}</span>
    </button>
  ) : (
    <button
      ref={btnRef}
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
  );

  const popup = (
    <AnimatePresence>
      {open && (
        <motion.div
          id="share-portal"
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.97 }}
          transition={{ duration: 0.12 }}
          style={{
            position: "fixed",
            zIndex: 9999,
            top: align === "top" ? undefined : pos.top,
            bottom: align === "top" ? `calc(100vh - ${pos.top}px)` : undefined,
            left: rtl ? undefined : pos.left,
            right: rtl ? `calc(100vw - ${pos.left}px)` : undefined,
          }}
          className="bg-[#1a1a24] border border-[#2a2a38] rounded-xl p-3 w-72 shadow-xl"
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
                  className="flex-1 bg-[#000000] border border-[#2a2a38] rounded-lg px-2 py-1.5 text-[11px] text-[#E8E8F0] focus:outline-none truncate"
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
  );

  return (
    <>
      {trigger}
      {createPortal(popup, document.body)}
    </>
  );
}
