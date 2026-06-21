import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Loader2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GradoLogo } from "@/components/grado-logo";
import { LangSwitcher } from "@/components/lang-switcher";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { t, rtl } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/pricing?onboard=1");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const perks = [t.perk1, t.perk2, t.perk3];

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center px-4 relative overflow-hidden" dir={rtl ? "rtl" : "ltr"}>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#5B5BD6]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[300px] h-[300px] bg-[#8B5CF6]/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 left-10 w-[300px] h-[300px] bg-[#6366f1]/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="absolute top-4 right-4">
        <LangSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </button>

        <div className="bg-[#08080F] border border-[#5B5BD6]/20 rounded-2xl p-8 shadow-[0_0_60px_rgba(91,91,214,0.1)]">
          <div className="flex items-center gap-3 mb-3">
            <div>
              <GradoLogo size={40} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t.registerTitle}</h1>
              <p className="text-xs text-[#8888A8]">{t.registerSub}</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap my-4">
            {perks.map((p) => (
              <div key={p} className="flex items-center gap-1.5 text-xs text-[#8888A8] bg-[#5B5BD6]/8 border border-[#5B5BD6]/20 rounded-full px-3 py-1">
                <Check className="w-3 h-3 text-[#5B5BD6]" /> {p}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">{t.fullName}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Karim Benali"
                autoComplete="name"
                required
                className="w-full bg-[#050508] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 focus:shadow-[0_0_0_3px_rgba(91,91,214,0.1)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                autoComplete="email"
                required
                className="w-full bg-[#050508] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 focus:shadow-[0_0_0_3px_rgba(91,91,214,0.1)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">{t.password}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full bg-[#050508] border border-[#2a2a38] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 focus:shadow-[0_0_0_3px_rgba(91,91,214,0.1)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8888A8] hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5B5BD6] hover:bg-[#4a4ac4] disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(91,91,214,0.4)] hover:shadow-[0_0_30px_rgba(91,91,214,0.6)] flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.registerBtn}
            </button>

            <p className="text-center text-xs text-[#4a4a5a]">{t.terms}</p>
          </form>

          <p className="text-center text-sm text-[#8888A8] mt-5">
            {t.hasAccount}{" "}
            <button onClick={() => navigate("/login")} className="text-[#7B7BFF] hover:text-[#a0a0ff] font-medium transition-colors">
              {t.toLogin}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
