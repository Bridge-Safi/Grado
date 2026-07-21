import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, Check, Shield, User, Brain, Sparkles, Save, Trash2, Gift, Copy, CheckCheck, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GradoLogo } from "@/components/grado-logo";

function SettingCard({ icon: Icon, title, children, danger }: { icon: React.ElementType; title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#080808] border rounded-2xl p-6 ${danger ? "border-red-500/15" : "border-[#1e1e2a]"}`}
    >
      <div className="flex items-center gap-3 mb-5">
        <Icon className={`w-5 h-5 ${danger ? "text-red-400" : "text-[#5B5BD6]"}`} />
        <h2 className={`font-semibold ${danger ? "text-red-400" : "text-white"}`}>{title}</h2>
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

  // Vérification email
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [emailVerified, setEmailVerified] = useState(user?.emailVerified ?? false);

  // Parrainage
  const [referralCopied, setReferralCopied] = useState(false);
  const referralCode = (user as any)?.referralCode;
  const referralLink = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : null;

  // Suppression de compte
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setEmailVerified(user?.emailVerified ?? false);
  }, [user]);

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

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError("");
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setVerifySuccess(true);
      setEmailVerified(true);
    } catch (err: any) { setVerifyError(err.message); }
    finally { setVerifyLoading(false); }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setResendDone(true);
      setTimeout(() => setResendDone(false), 4000);
    } finally { setResendLoading(false); }
  };

  const handleCopyReferral = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      logout();
      navigate("/");
    } catch (err: any) { setDeleteError(err.message); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white">

      <nav className="border-b border-[#1e1e2a]/80 bg-[#000000]/90 backdrop-blur-md sticky top-0 z-10">
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
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{user?.email}</span>
                {emailVerified
                  ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">Vérifié ✓</span>
                  : <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">Non vérifié</span>
                }
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#8888A8]">Plan</span>
              <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#5B5BD6]/15 text-[#5B5BD6] text-xs font-semibold border border-[#5B5BD6]/30">{user?.plan}</span>
            </div>
          </div>
        </SettingCard>

        {/* Vérification email */}
        {!emailVerified && (
          <SettingCard icon={Mail} title="Vérifie ton adresse email">
            {verifySuccess ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Check className="w-4 h-4" /> Email vérifié avec succès !
              </div>
            ) : (
              <>
                <p className="text-xs text-[#8888A8] mb-4">Un code de 6 chiffres t'a été envoyé à <strong className="text-white">{user?.email}</strong>. Entre-le ci-dessous pour activer ton compte.</p>
                <form onSubmit={handleVerifyEmail} className="flex gap-2">
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="flex-1 bg-[#0e0e16] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-sm text-white font-mono tracking-widest text-center focus:outline-none focus:border-[#5B5BD6]"
                  />
                  <button type="submit" disabled={verifyLoading || verifyCode.length !== 6}
                    className="px-5 py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2">
                    {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Vérifier
                  </button>
                </form>
                {verifyError && <p className="text-sm text-red-400 mt-2">{verifyError}</p>}
                <button onClick={handleResendCode} disabled={resendLoading}
                  className="mt-3 text-xs text-[#5B5BD6] hover:text-[#a0a0ff] transition-colors disabled:opacity-50">
                  {resendDone ? "✓ Code renvoyé !" : resendLoading ? "Envoi…" : "Renvoyer le code"}
                </button>
              </>
            )}
          </SettingCard>
        )}

        {/* Parrainage */}
        {referralLink && (
          <SettingCard icon={Gift} title="Parrainage — Gagne des créations bonus">
            <p className="text-xs text-[#8888A8] mb-4">Partage ton lien et gagne <strong className="text-[#5B5BD6]">+5 créations</strong> pour chaque ami qui s'inscrit avec ton code.</p>
            <div className="flex gap-2 mb-3">
              <input
                readOnly
                value={referralLink}
                className="flex-1 bg-[#0e0e16] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-xs text-[#8888A8] font-mono focus:outline-none"
              />
              <button onClick={handleCopyReferral}
                className="px-4 py-2.5 rounded-xl bg-[#5B5BD6]/15 border border-[#5B5BD6]/30 hover:bg-[#5B5BD6]/25 text-[#5B5BD6] font-medium text-sm transition-all flex items-center gap-2">
                {referralCopied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {referralCopied ? "Copié !" : "Copier"}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8888A8]">
              <span>Ton code :</span>
              <span className="font-mono font-bold text-white bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 px-2 py-0.5 rounded-lg">{referralCode}</span>
            </div>
          </SettingCard>
        )}

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
        <SettingCard icon={Trash2} title="Zone danger" danger>
          <div className="space-y-6">
            {/* Déconnexion */}
            <div>
              <p className="text-sm text-[#8888A8] mb-3">Se déconnecter de tous les appareils.</p>
              <button onClick={() => { logout(); navigate("/"); }} className="text-sm px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                Se déconnecter
              </button>
            </div>

            {/* Suppression de compte */}
            <div className="pt-4 border-t border-red-500/10">
              <p className="text-sm text-[#8888A8] mb-3">
                <strong className="text-red-400">Supprimer mon compte</strong> — Cette action est irréversible. Toutes tes conversations, sites et données seront définitivement supprimés.
              </p>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="text-sm px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Supprimer mon compte
                </button>
              ) : (
                <form onSubmit={handleDeleteAccount} className="space-y-3">
                  <p className="text-xs text-red-400/80">Confirme ton mot de passe pour supprimer définitivement ton compte :</p>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Mot de passe actuel"
                    required
                    className="w-full bg-[#0e0e16] border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/60"
                  />
                  {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}
                      className="flex-1 py-2.5 rounded-xl border border-[#2a2a38] text-[#8888A8] hover:text-white text-sm font-medium transition-colors">
                      Annuler
                    </button>
                    <button type="submit" disabled={deleteLoading || !deletePassword}
                      className="flex-1 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      {deleteLoading ? "Suppression…" : "Supprimer définitivement"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </SettingCard>
      </main>
    </div>
  );
}
