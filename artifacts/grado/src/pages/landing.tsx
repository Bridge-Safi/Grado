import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Zap, Code2, Music, Video, ArrowRight, Check, Star } from "lucide-react";
import logoUrl from "@assets/D589D749-E25A-4876-ACE2-D9DFD1C31E5C_1780620985737.png";

const FEATURES = [
  { icon: Code2, title: "Apps & Sites web", desc: "Décris ton idée, Grado génère l'application complète en quelques secondes avec preview live." },
  { icon: Music, title: "Musique IA", desc: "Beats, mélodies, ambiances — génère des morceaux audio directement dans le chat." },
  { icon: Video, title: "Vidéos IA", desc: "Crée des vidéos cinématiques à partir d'un simple texte. Prêtes à partager." },
];

const TESTIMONIALS = [
  { name: "Karim B.", role: "Entrepreneur", text: "J'ai lancé mon site e-commerce en 10 minutes. Incroyable.", stars: 5 },
  { name: "Sara M.", role: "Créatrice de contenu", text: "Je génère mes musiques pour mes vidéos sans aucune connaissance musicale.", stars: 5 },
  { name: "Youssef A.", role: "Développeur", text: "Grado me fait gagner des heures chaque semaine sur les projets clients.", stars: 5 },
];

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e1e2a] bg-[#0D0D12]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Grado" className="w-6 h-6 object-contain" />
            <span className="text-base font-bold tracking-tight">Grado</span>
          </div>
          <div className="flex-1" />
          <button onClick={() => navigate("/pricing")} className="text-sm text-[#8888A8] hover:text-white transition-colors hidden sm:block">Tarifs</button>
          <button onClick={() => navigate("/login")} className="text-sm text-[#8888A8] hover:text-white transition-colors">Connexion</button>
          <button
            onClick={() => navigate("/register")}
            className="text-sm bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white px-4 py-2 rounded-lg font-medium transition-all shadow-[0_0_16px_rgba(91,91,214,0.35)]"
          >
            Commencer gratuitement
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-5 relative">
        {/* Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#5B5BD6]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-[#5B5BD6]/15 border border-[#5B5BD6]/30 rounded-full px-4 py-1.5 mb-6"
          >
            <Zap className="w-3.5 h-3.5 text-[#5B5BD6]" />
            <span className="text-xs font-semibold text-[#5B5BD6]">Essai gratuit 48h · Aucune carte requise</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
          >
            Construis. Compose.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B5BD6] to-[#8B8BFF]">
              Crée.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#8888A8] mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Décris ce que tu veux — Grado génère des applications, de la musique et des vidéos en direct dans le chat. L'IA créative tout-en-un.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-all shadow-[0_0_24px_rgba(91,91,214,0.45)] hover:shadow-[0_0_32px_rgba(91,91,214,0.6)]"
            >
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="flex items-center gap-2 border border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/40 px-7 py-3.5 rounded-xl font-medium text-base transition-all"
            >
              Voir les tarifs
            </button>
          </motion.div>

          {/* Demo preview mock */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-16 rounded-2xl border border-[#2a2a38] bg-[#111118] overflow-hidden shadow-2xl shadow-black/50 text-left"
          >
            <div className="border-b border-[#2a2a38] px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-[#8888A8]">Grado — Chat</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-end">
                <div className="bg-[#5B5BD6] text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 max-w-xs">
                  Génère-moi une app todo moderne avec dark mode
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-[#18181f] border border-[#2a2a38] flex items-center justify-center shrink-0">
                  <img src={logoUrl} alt="G" className="w-4 h-4 object-contain" />
                </div>
                <div className="bg-[#18181f] border border-[#2a2a38] text-[#E8E8F0] text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-sm">
                  Voici ton app Todo avec dark mode, animations et localStorage ✨
                  <div className="mt-2 rounded-lg bg-[#0D0D12] border border-[#2a2a38] p-3 text-xs text-[#5B5BD6] font-mono">
                    ▶ Preview live chargée
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#5B5BD6] text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 max-w-xs">
                  Génère-moi un beat hip-hop énergique
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-[#18181f] border border-[#2a2a38] flex items-center justify-center shrink-0">
                  <img src={logoUrl} alt="G" className="w-4 h-4 object-contain" />
                </div>
                <div className="bg-[#18181f] border border-[#2a2a38] text-[#E8E8F0] text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-sm">
                  🎵 Musique générée — 22 secondes
                  <div className="mt-2 flex items-center gap-2 bg-[#0D0D12] rounded-lg p-2.5 border border-[#2a2a38]">
                    <div className="w-7 h-7 rounded-full bg-[#5B5BD6] flex items-center justify-center shrink-0">▶</div>
                    <div className="flex-1 h-1 bg-[#2a2a38] rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-[#5B5BD6] rounded-full" />
                    </div>
                    <span className="text-xs text-[#8888A8]">0:22</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-5 border-t border-[#1e1e2a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Tout ce dont tu as besoin</h2>
            <p className="text-[#8888A8]">Un seul outil pour créer apps, musiques et vidéos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#111118] border border-[#2a2a38] rounded-2xl p-6 hover:border-[#5B5BD6]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#5B5BD6]/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#5B5BD6]" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[#8888A8] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-5 border-t border-[#1e1e2a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Ce qu'ils en disent</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#111118] border border-[#2a2a38] rounded-2xl p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#5B5BD6] text-[#5B5BD6]" />
                  ))}
                </div>
                <p className="text-sm text-[#C8C8E8] leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-[#8888A8]">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5 border-t border-[#1e1e2a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Prêt à créer ?</h2>
          <p className="text-[#8888A8] mb-8">Inscris-toi gratuitement. 48h d'essai. Aucune carte bancaire.</p>
          <button
            onClick={() => navigate("/register")}
            className="inline-flex items-center gap-2 bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-[0_0_24px_rgba(91,91,214,0.4)]"
          >
            Créer mon compte <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e1e2a] py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Grado" className="w-5 h-5 object-contain" />
            <span className="text-sm font-semibold">Grado</span>
          </div>
          <div className="flex gap-6">
            <button onClick={() => navigate("/pricing")} className="text-xs text-[#8888A8] hover:text-white transition-colors">Tarifs</button>
            <button onClick={() => navigate("/login")} className="text-xs text-[#8888A8] hover:text-white transition-colors">Connexion</button>
            <button onClick={() => navigate("/register")} className="text-xs text-[#8888A8] hover:text-white transition-colors">Inscription</button>
          </div>
          <p className="text-xs text-[#8888A8]">© 2026 Grado · Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}
