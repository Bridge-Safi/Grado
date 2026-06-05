import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Loader2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import logoUrl from "@assets/D589D749-E25A-4876-ACE2-D9DFD1C31E5C_1780620985737.png";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
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
      navigate("/chat");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const perks = ["Essai gratuit 48h", "Aucune carte bancaire", "Accès immédiat"];

  return (
    <div className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center px-4 relative">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#5B5BD6]/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <div className="bg-[#111118] border border-[#2a2a38] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2.5 mb-2">
            <img src={logoUrl} alt="Grado" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-white">Créer un compte</h1>
              <p className="text-xs text-[#8888A8]">Rejoins des milliers de créateurs</p>
            </div>
          </div>

          <div className="flex gap-4 my-5">
            {perks.map((p) => (
              <div key={p} className="flex items-center gap-1 text-xs text-[#8888A8]">
                <Check className="w-3 h-3 text-[#5B5BD6]" /> {p}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">Prénom / Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Karim Benali"
                required
                className="w-full bg-[#0D0D12] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="w-full bg-[#0D0D12] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  required
                  minLength={6}
                  className="w-full bg-[#0D0D12] border border-[#2a2a38] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/60 transition-colors"
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
              className="w-full bg-[#5B5BD6] hover:bg-[#4a4ac4] disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-[0_0_16px_rgba(91,91,214,0.35)] flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer mon compte gratuit
            </button>

            <p className="text-center text-xs text-[#4a4a5a]">
              En t'inscrivant, tu acceptes les conditions d'utilisation.
            </p>
          </form>

          <p className="text-center text-sm text-[#8888A8] mt-5">
            Déjà un compte ?{" "}
            <button onClick={() => navigate("/login")} className="text-[#5B5BD6] hover:text-[#8B8BFF] font-medium transition-colors">
              Se connecter
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
