import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Zap, Code2, Music, Video, ArrowRight, Star } from "lucide-react";
import { GradoLogo } from "@/components/grado-logo";
import { LangSwitcher } from "@/components/lang-switcher";
import { useI18n } from "@/lib/i18n";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { t, rtl } = useI18n();

  const FEATURES = [
    { icon: Code2, title: t.f1Title, desc: t.f1Desc },
    { icon: Music, title: t.f2Title, desc: t.f2Desc },
    { icon: Video, title: t.f3Title, desc: t.f3Desc },
  ];

  const TESTIMONIALS = [
    { name: "Karim B.", role: "Entrepreneur", text: t.t1, stars: 5 },
    { name: "Sara M.", role: "Créatrice de contenu", text: t.t2, stars: 5 },
    { name: "Youssef A.", role: "Développeur", text: t.t3, stars: 5 },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white overflow-x-hidden" dir={rtl ? "rtl" : "ltr"}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e1e2a]/80 bg-[#000000]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <GradoLogo size={30} />
            <span className="text-base font-bold tracking-tight">Grado</span>
          </div>
          <div className="flex-1" />
          <LangSwitcher />
          <button onClick={() => navigate("/pricing")} className="text-sm text-[#8888A8] hover:text-white transition-colors hidden sm:block">{t.navPricing}</button>
          <button onClick={() => navigate("/login")} className="text-sm text-[#8888A8] hover:text-white transition-colors">{t.navLogin}</button>
          <button
            onClick={() => navigate("/register")}
            className="text-sm bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white px-4 py-2 rounded-lg font-medium transition-all shadow-[0_0_16px_rgba(91,91,214,0.4)]"
          >
            {t.navStart}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-5 relative overflow-hidden">

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-[#5B5BD6]/15 border border-[#5B5BD6]/30 rounded-full px-4 py-1.5 mb-6 shadow-[0_0_20px_rgba(91,91,214,0.15)]"
          >
            <Zap className="w-3.5 h-3.5 text-[#5B5BD6]" />
            <span className="text-xs font-semibold text-[#5B5BD6]">{t.badge}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.02 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#5B5BD6]/30 rounded-2xl blur-2xl scale-150" />
              <GradoLogo size={64} className="relative" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
          >
            {t.heroLine1}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B7BFF] to-[#5B5BD6]">
              {t.heroLine2}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#8888A8] mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {t.heroDesc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-all shadow-[0_0_32px_rgba(91,91,214,0.5)] hover:shadow-[0_0_48px_rgba(91,91,214,0.7)]"
            >
              {t.ctaCreate} <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="flex items-center gap-2 border border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/50 px-7 py-3.5 rounded-xl font-medium text-base transition-all hover:shadow-[0_0_16px_rgba(91,91,214,0.15)]"
            >
              {t.ctaPricing}
            </button>
          </motion.div>

          {/* Demo preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-16 rounded-2xl border border-[#5B5BD6]/20 bg-[#050505] overflow-hidden shadow-[0_0_60px_rgba(91,91,214,0.12)] text-left"
          >
            <div className="border-b border-[#2a2a38] px-4 py-3 flex items-center gap-2 bg-[#020202]">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-[#8888A8]">Grado — Chat</span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5B5BD6] animate-pulse" />
                <span className="text-[10px] text-[#5B5BD6]">En ligne</span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-end">
                <div className="bg-[#5B5BD6] text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 max-w-xs shadow-[0_0_12px_rgba(91,91,214,0.3)]">
                  Génère-moi une app todo moderne avec dark mode
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-[#0A0A0A] border border-[#5B5BD6]/30 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(91,91,214,0.2)]">
                  <GradoLogo size={18} />
                </div>
                <div className="bg-[#0A0A0A] border border-[#2a2a38] text-[#E8E8F0] text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-sm">
                  Voici ton app Todo avec dark mode, animations et localStorage ✨
                  <div className="mt-2 rounded-lg bg-[#000000] border border-[#5B5BD6]/20 p-3 text-xs text-[#5B5BD6] font-mono">
                    ▶ Preview live chargée
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#5B5BD6] text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 max-w-xs shadow-[0_0_12px_rgba(91,91,214,0.3)]">
                  Génère-moi un beat hip-hop énergique
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-[#0A0A0A] border border-[#5B5BD6]/30 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(91,91,214,0.2)]">
                  <GradoLogo size={18} />
                </div>
                <div className="bg-[#0A0A0A] border border-[#2a2a38] text-[#E8E8F0] text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-sm">
                  🎵 Musique générée — 22 secondes
                  <div className="mt-2 flex items-center gap-2 bg-[#000000] rounded-lg p-2.5 border border-[#5B5BD6]/20">
                    <div className="w-7 h-7 rounded-full bg-[#5B5BD6] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(91,91,214,0.4)] text-xs">▶</div>
                    <div className="flex-1 h-1 bg-[#2a2a38] rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-gradient-to-r from-[#5B5BD6] to-[#8B8BFF] rounded-full" />
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
      <section className="py-20 px-5 border-t border-[#1e1e2a] relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t.featuresTitle}</h2>
            <p className="text-[#8888A8]">{t.featuresSub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#050505] border border-[#2a2a38] rounded-2xl p-6 hover:border-[#5B5BD6]/50 hover:shadow-[0_0_24px_rgba(91,91,214,0.1)] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#5B5BD6]/15 flex items-center justify-center mb-4 group-hover:bg-[#5B5BD6]/25 group-hover:shadow-[0_0_16px_rgba(91,91,214,0.25)] transition-all">
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
      <section className="py-20 px-5 border-t border-[#1e1e2a] relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t.testimonialsTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#050505] border border-[#2a2a38] rounded-2xl p-6 hover:border-[#5B5BD6]/30 transition-all"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: item.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#5B5BD6] text-[#5B5BD6]" />
                  ))}
                </div>
                <p className="text-sm text-[#C8C8E8] leading-relaxed mb-4">"{item.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-[#8888A8]">{item.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5 border-t border-[#1e1e2a] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#5B5BD6]/5 to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#5B5BD6]/40 rounded-2xl blur-2xl scale-150" />
              <GradoLogo size={56} className="relative" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">{t.ctaTitle}</h2>
          <p className="text-[#8888A8] mb-8">{t.ctaSub}</p>
          <button
            onClick={() => navigate("/register")}
            className="inline-flex items-center gap-2 bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-[0_0_40px_rgba(91,91,214,0.5)] hover:shadow-[0_0_60px_rgba(91,91,214,0.7)]"
          >
            {t.ctaBtn} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e1e2a] py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <GradoLogo size={24} />
            <span className="text-sm font-semibold">Grado</span>
          </div>
          <div className="flex gap-6">
            <button onClick={() => navigate("/pricing")} className="text-xs text-[#8888A8] hover:text-white transition-colors">{t.navPricing}</button>
            <button onClick={() => navigate("/login")} className="text-xs text-[#8888A8] hover:text-white transition-colors">{t.navLogin}</button>
            <button onClick={() => navigate("/register")} className="text-xs text-[#8888A8] hover:text-white transition-colors">{t.navSignup}</button>
          </div>
          <p className="text-xs text-[#8888A8]">{t.footerRights}</p>
        </div>
      </footer>
    </div>
  );
}
