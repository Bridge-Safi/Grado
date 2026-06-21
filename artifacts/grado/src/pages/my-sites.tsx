import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Globe, Trash2, ExternalLink, Copy, CheckCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GradoLogo } from "@/components/grado-logo";
import { motion, AnimatePresence } from "framer-motion";

interface SiteRow {
  id: number;
  slug: string;
  title: string;
  viewCount: number;
  createdAt: string;
}

export default function MySitesPage() {
  const [, navigate] = useLocation();
  const { token } = useAuth();
  const [mySites, setMySites] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sites", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMySites(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCopy = async (slug: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Supprimer ce site définitivement ?")) return;
    setDeleting(slug);
    try {
      await fetch(`/api/sites/${slug}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setMySites(s => s.filter(x => x.slug !== slug));
    } finally { setDeleting(null); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#5B5BD6]/8 rounded-full blur-[120px] pointer-events-none" />

      <nav className="border-b border-[#1e1e2a]/80 bg-[#050508]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/chat")}
            className="flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <GradoLogo size={22} />
            <span className="font-bold text-white text-sm">Mes Sites</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Mes sites hébergés</h1>
            <p className="text-sm text-[#8888A8]">Tous les sites que tu as publiés depuis Grado</p>
          </div>
          <button onClick={() => navigate("/chat")}
            className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white font-medium shadow-[0_0_12px_rgba(91,91,214,0.3)] transition-colors">
            <Globe className="w-3.5 h-3.5" />
            Créer un nouveau site
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#5B5BD6] animate-spin" />
          </div>
        ) : mySites.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 flex items-center justify-center">
              <Globe className="w-7 h-7 text-[#5B5BD6]" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Aucun site publié</p>
              <p className="text-sm text-[#8888A8]">Génère une app dans le chat, puis clique sur <strong className="text-[#7B7BFF]">Publier</strong> pour l'héberger ici.</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {mySites.map((site, i) => (
                <motion.div key={site.slug}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                  className="group rounded-2xl border border-[#2a2a38] bg-[#08080F] hover:border-[#5B5BD6]/30 transition-all p-5 flex items-center gap-4">

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-[#5B5BD6]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{site.title}</p>
                    <p className="text-xs text-[#5B5BD6] truncate mt-0.5 font-mono">
                      {window.location.origin}/s/{site.slug}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-[#8888A8]">{fmt(site.createdAt)}</span>
                      <span className="text-[10px] text-[#8888A8]">·</span>
                      <span className="text-[10px] text-[#8888A8]">{site.viewCount} vue{site.viewCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a href={`/s/${site.slug}`} target="_blank" rel="noopener noreferrer"
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-[#8888A8] hover:text-white hover:bg-[#1e1e2a] transition-colors"
                      title="Ouvrir">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => handleCopy(site.slug)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-[#8888A8] hover:text-white hover:bg-[#1e1e2a] transition-colors"
                      title="Copier le lien">
                      {copied === site.slug
                        ? <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(site.slug)} disabled={deleting === site.slug}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-[#8888A8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Supprimer">
                      {deleting === site.slug
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Custom domain info */}
        <div className="mt-10 rounded-2xl border border-[#2a2a38] bg-[#08080F] p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 flex items-center justify-center shrink-0 mt-0.5">
              <Globe className="w-5 h-5 text-[#5B5BD6]" />
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Domaine personnalisé</p>
              <p className="text-sm text-[#8888A8] mb-3">
                Tu veux publier sur <strong className="text-white">tonsite.com</strong> ? Pointe ton domaine vers Grado avec un enregistrement CNAME.
              </p>
              <div className="bg-[#050508] rounded-xl p-3 font-mono text-xs border border-[#2a2a38] space-y-1">
                <p className="text-[#8888A8]">Enregistrement DNS à ajouter :</p>
                <p><span className="text-[#7B7BFF]">Type :</span> <span className="text-white">CNAME</span></p>
                <p><span className="text-[#7B7BFF]">Nom :</span> <span className="text-white">@ ou www</span></p>
                <p><span className="text-[#7B7BFF]">Valeur :</span> <span className="text-green-400">{window.location.hostname}</span></p>
              </div>
              <p className="text-xs text-[#8888A8] mt-2">Disponible sur les plans <span className="text-[#7B7BFF] font-medium">Hacker</span> et <span className="text-[#7B7BFF] font-medium">Pro</span>.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
