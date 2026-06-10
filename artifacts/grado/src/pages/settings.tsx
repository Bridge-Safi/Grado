import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, Check, Shield, User, Brain, Sparkles, Save } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GradoLogo } from "@/components/grado-logo";

function SettingCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#12121a] border border-[#1e1e2a] rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <Icon className="w-5 h-5 text-[#5B5BD6]" />
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { user, token, logout } = useAuth();

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  // Memory & Custom instructions
  const [memoryNotes, setMemoryNotes] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/user-settings", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setMemoryNotes(d.memoryNotes ?? "");
          setCustomInstructions(d.customInstructions ?? "");
        }
      })
      .finally(() => setSettingsLoading(false));
  }, [token]);

  const saveSettings = async () => {
    if (!token) return;
    setSettingsSaving(true);
    await fetch("/api/user-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ memoryNotes, customInstructions }),
    });
    setSettingsSaving(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (newPassword.length < 6) { setPwError("Le nouveau mot de passe doit faire au moins 6 caractères"); return; }
    if (newPassword !== confirmPassword) { setPwError("Les mots de passe ne correspondent pas"); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setPwSuccess("Mot de passe modifié ✓");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) { setPwError(err.message); }
    finally { setPwLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#5B5BD6]/8 rounded-full blur-[120px] pointer-events-none" />

      <nav className="border-b border-[#1e1e2a]/80 bg-[#0D0D12]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/chat")} className="flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au chat
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <GradoLogo size={24} />
            <span className="font-bold text-white text-sm tracking-tight">Grado</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-6">
        <h1 className="text-2xl font-bold">Paramètres</h1>

        {/* Profile */}
        <SettingCard icon={User} title="Profil">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-[#1e1e2a]">
              <span className="text-[#8888A8]">Nom</span>
              <span className="text-white font-medium">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#1e1e2a]">
              <span className="text-[#8888A8]">Email</span>
              <span className="text-white font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#8888A8]">Plan</span>
              <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#5B5BD6]/15 text-[#5B5BD6] text-xs font-semibold border border-[#5B5BD6]/30">{user?.plan}</span>
            </div>
          </div>
        </SettingCard>

        {/* Memory */}
        <SettingCard icon={Brain} title="Mémoire — Ce que Grado sait de toi">
          <p className="text-xs text-[#8888A8] mb-3">Ces informations sont injectées dans chaque conversation. Grado les utilisera pour personnaliser ses réponses.</p>
          {settingsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-[#5B5BD6] animate-spin" /></div>
          ) : (
            <textarea
              value={memoryNotes}
              onChange={e => setMemoryNotes(e.target.value)}
              rows={5}
              placeholder="Ex: Je m'appelle Khalidou, j'habite à Paris. Je crée des apps pour le marché africain. Je préfère les réponses courtes et directes. Mon langage préféré est JavaScript."
              className="w-full bg-[#0e0e16] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 resize-none transition-colors"
            />
          )}
        </SettingCard>

        {/* Custom Instructions */}
        <SettingCard icon={Sparkles} title="Instructions personnalisées">
          <p className="text-xs text-[#8888A8] mb-3">Dis à Grado comment tu veux qu'il se comporte, son ton, ce qu'il doit éviter ou privilégier.</p>
          {settingsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-[#5B5BD6] animate-spin" /></div>
          ) : (
            <textarea
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              rows={5}
              placeholder="Ex: Réponds toujours en français. Sois concis et direct. Pour les apps, utilise toujours Tailwind CSS. Ne mets jamais de code commenté. Commence tes réponses directement sans introduction."
              className="w-full bg-[#0e0e16] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/70 resize-none transition-colors"
            />
          )}
          <button
            onClick={saveSettings}
            disabled={settingsSaving || settingsLoading}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white font-semibold text-sm transition-all disabled:opacity-50"
          >
            {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : settingsSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {settingsSaving ? "Sauvegarde…" : settingsSaved ? "Sauvegardé !" : "Sauvegarder"}
          </button>
        </SettingCard>

        {/* Change password */}
        <SettingCard icon={Shield} title="Changer le mot de passe">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">Mot de passe actuel</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required className="w-full bg-[#0e0e16] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-sm text-white pr-10 focus:outline-none focus:border-[#5B5BD6]" placeholder="••••••••" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6666A8] hover:text-white">{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required className="w-full bg-[#0e0e16] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-sm text-white pr-10 focus:outline-none focus:border-[#5B5BD6]" placeholder="Min. 6 caractères" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6666A8] hover:text-white">{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#8888A8] mb-1.5">Confirmer</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required className="w-full bg-[#0e0e16] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B5BD6]" placeholder="••••••••" />
            </div>
            {pwError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{pwError}</p>}
            {pwSuccess && <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2"><Check className="w-4 h-4" />{pwSuccess}</div>}
            <button type="submit" disabled={pwLoading} className="w-full py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {pwLoading ? "Mise à jour…" : "Modifier le mot de passe"}
            </button>
          </form>
        </SettingCard>

        {/* Danger zone */}
        <div className="bg-[#12121a] border border-red-500/15 rounded-2xl p-6">
          <h2 className="font-semibold text-red-400 mb-3">Zone danger</h2>
          <p className="text-sm text-[#8888A8] mb-4">Se déconnecter de tous les appareils.</p>
          <button onClick={() => { logout(); navigate("/"); }} className="text-sm px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
            Se déconnecter
          </button>
        </div>
      </main>
    </div>
  );
}
