import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2, Mail, KeyRound } from "lucide-react";
import { GradoLogo } from "@/components/grado-logo";

type Step = "email" | "code" | "done";

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "";

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setStep("code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
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
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center px-4 relative overflow-hidden">

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

        <div className="bg-[#050505] border border-[#5B5BD6]/20 rounded-2xl p-8 shadow-[0_0_60px_rgba(91,91,214,0.1)]">
          {step === "done" ? (
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
          ) : step === "email" ? (
            <>
              <div className="flex items-center gap-3 mb-8">
                <GradoLogo size={40} />
                <div>
                  <h1 className="text-xl font-bold text-white">Mot de passe oublié</h1>
                  <p className="text-xs text-[#8888A8]">Reçois un code par email</p>
                </div>
              </div>

              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#8888A8] mb-1.5">Ton adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    required
                    className="w-full bg-[#000000] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 transition-all"
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
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Envoyer le code par email
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <GradoLogo size={40} />
                <div>
                  <h1 className="text-xl font-bold text-white">Vérification</h1>
                  <p className="text-xs text-[#8888A8]">Code envoyé à {email}</p>
                </div>
              </div>

              <div className="bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 rounded-xl px-4 py-3 mb-5 text-sm text-[#a0a0ff]">
                Un code à 6 chiffres a été envoyé à ton adresse email. Vérifie aussi tes spams.
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#8888A8] mb-1.5">Code reçu par email</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="w-full bg-[#000000] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 transition-all tracking-[0.4em] text-center font-mono text-lg"
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
                    className="w-full bg-[#000000] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 transition-all"
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
                    className="w-full bg-[#000000] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 transition-all"
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
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  Réinitialiser le mot de passe
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); setCode(""); }}
                  className="w-full text-sm text-[#8888A8] hover:text-white transition-colors py-2"
                >
                  Changer l'adresse email
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
