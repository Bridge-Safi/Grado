import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { GradoLogo } from "@/components/grado-logo";

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    if (newPassword !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#5B5BD6]/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </button>

        <div className="bg-[#111118] border border-[#5B5BD6]/20 rounded-2xl p-8 shadow-[0_0_60px_rgba(91,91,214,0.1)]">
          {done ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Mot de passe mis à jour !</h2>
              <p className="text-sm text-[#8888A8]">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
              <button
                onClick={() => navigate("/login")}
                className="mt-4 w-full bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white py-3 rounded-xl font-semibold text-sm transition-all"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-8">
                <GradoLogo size={40} />
                <div>
                  <h1 className="text-xl font-bold text-white">Mot de passe oublié</h1>
                  <p className="text-xs text-[#8888A8]">Crée un nouveau mot de passe</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#8888A8] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    required
                    className="w-full bg-[#0D0D12] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#8888A8] mb-1.5">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 caractères"
                    required
                    minLength={6}
                    className="w-full bg-[#0D0D12] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#8888A8] mb-1.5">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Répète le mot de passe"
                    required
                    className="w-full bg-[#0D0D12] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5B5BD6] hover:bg-[#4a4ac4] disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(91,91,214,0.4)] flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Réinitialiser le mot de passe
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
