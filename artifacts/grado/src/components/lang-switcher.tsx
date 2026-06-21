import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useI18n, LANGS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white transition-colors rounded-lg px-2 py-1.5 hover:bg-[#1a1a28]",
          open && "text-white bg-[#1a1a28]"
        )}
        title="Langue / Language"
      >
        <Globe className="w-3.5 h-3.5" />
        {!compact && <span className="text-xs font-medium">{current.flag} {current.code.toUpperCase()}</span>}
        {compact && <span className="text-xs">{current.flag}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-[#08080F] border border-[#2a2a38] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left",
                lang === l.code
                  ? "bg-[#5B5BD6]/15 text-[#7B7BFF]"
                  : "text-[#8888A8] hover:text-white hover:bg-[#1a1a28]"
              )}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className={l.rtl ? "font-arabic" : ""}>{l.label}</span>
              {lang === l.code && <span className="ml-auto text-[#5B5BD6] text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
