import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Loader2, Download } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GradoLogo } from "@/components/grado-logo";
import { LangSwitcher } from "@/components/lang-switcher";
import { useI18n } from "@/lib/i18n";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { t, rtl } = useI18n();
  const { canInstall, install } = usePwaInstall();
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
      await login(email, password);
      navigate("/chat");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center px-4 relative overflow-hidden" dir={rtl ? "rtl" : "ltr"}>

      {/* Lang switcher top right */}
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

        <div className="bg-[#050505] border border-[#5B5BD6]/20 rounded-2xl p-8 shadow-[0_0_60px_rgba(91,91,214,0.1)]">
          <div className="flex items-center gap-3 mb-8">
            <div>
              <GradoLogo size={40} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t.loginTitle}</h1>
              <p className="text-xs text-[#8888A8]">{t.loginSub}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                autoComplete="email"
                required
                className="w-full bg-[#000000] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 focus:shadow-[0_0_0_3px_rgba(91,91,214,0.1)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">{t.password}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#000000] border border-[#2a2a38] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 focus:shadow-[0_0_0_3px_rgba(91,91,214,0.1)] transition-all"
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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-[#7B7BFF] hover:text-[#a0a0ff] transition-colors"
              >
                Mot de passe oublié ?
              </button>
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
              {t.loginBtn}
            </button>

            {canInstall && (
              <button
                type="button"
                onClick={install}
                className="w-full flex items-center justify-center gap-2 border border-[#5B5BD6]/30 hover:border-[#5B5BD6]/60 text-[#8888A8] hover:text-white py-3 rounded-xl text-sm transition-all hover:bg-[#5B5BD6]/10"
              >
                <Download className="w-4 h-4" />
                Installer l'application
              </button>
            )}
          </form>

          <p className="text-center text-sm text-[#8888A8] mt-6">
            {t.noAccount}{" "}
            <button onClick={() => navigate("/register")} className="text-[#7B7BFF] hover:text-[#a0a0ff] font-medium transition-colors">
              {t.toRegister}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
