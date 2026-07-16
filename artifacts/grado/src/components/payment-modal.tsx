import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, Clock, CreditCard, Building2, Wallet, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface PaymentConfig {
  iban: string;
  holder: string;
  phone: string;
  bank: string;
  paypal: string;
}

// Masque un IBAN/RIB : garde les 4 premiers et 4 derniers caractères visibles,
// remplace le reste par des points — évite d'exposer le RIB en clair à l'écran
// (capture d'écran, épaule curieuse) tout en gardant la copie intégrale possible.
function maskIban(iban: string): string {
  const clean = iban.replace(/\s+/g, "");
  if (clean.length <= 8) return iban;
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start} •••• •••• ${end}`;
}

interface PaymentModalProps {
  plan: Plan;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ plan, onClose, onSuccess }: PaymentModalProps) {
  const { token } = useAuth();
  const [tab, setTab] = useState<"qr" | "virement" | "paypal">("qr");
  const [reference, setReference] = useState<string>("");
  const [config, setConfig] = useState<PaymentConfig>({ iban: "", holder: "Grado", phone: "", bank: "", paypal: "" });
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [ibanRevealed, setIbanRevealed] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    setError("");
    try {
      const [reqRes, cfgRes] = await Promise.all([
        fetch("/api/payments/request", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ plan: plan.id }),
        }),
        fetch("/api/payments/config"),
      ]);
      const reqData = await reqRes.json();
      if (!reqRes.ok) throw new Error(reqData.error || "Erreur lors de la création de la demande");
      const cfgData = await cfgRes.json();
      setReference(reqData.reference);
      setConfig(cfgData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const qrLines = [
    `PAIEMENT GRADO`,
    config.holder ? `Bénéficiaire: ${config.holder}` : null,
    config.bank ? `Banque: ${config.bank}` : null,
    config.iban ? `IBAN/RIB: ${config.iban}` : null,
    config.phone ? `Mobile: ${config.phone}` : null,
    `Montant: ${plan.price} DH`,
    `Référence: ${reference}`,
    `Plan: ${plan.name}`,
  ].filter(Boolean).join("\n");

  const handleConfirm = () => {
    setSubmitted(true);
    onSuccess();
  };

  const ibanConfigured = config.iban || config.phone;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-[#050505] border border-[#2a2a38] rounded-2xl w-full max-w-md shadow-[0_0_80px_rgba(91,91,214,0.2)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2a]">
            <div>
              <h2 className="font-bold text-white text-base">Paiement — Plan {plan.name}</h2>
              <p className="text-xs text-[#8888A8] mt-0.5">{plan.price} Dh/mois · Activation sous 24h</p>
            </div>
            <button onClick={onClose} className="text-[#8888A8] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-[#8888A8]">
              <Loader2 className="w-5 h-5 animate-spin text-[#5B5BD6]" />
              <span className="text-sm">Préparation du paiement…</span>
            </div>
          ) : error ? (
            <div className="p-5">
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
              <button onClick={init} className="mt-3 w-full py-2 rounded-xl bg-[#1e1e2e] border border-[#3a3a50] text-white text-sm font-semibold hover:bg-[#2a2a3e] transition-all">
                Réessayer
              </button>
            </div>
          ) : submitted ? (
            <div className="p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-[#5B5BD6]/15 border border-[#5B5BD6]/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(91,91,214,0.2)]">
                <Clock className="w-7 h-7 text-[#5B5BD6]" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Demande envoyée !</h3>
              <p className="text-sm text-[#8888A8] leading-relaxed mb-4">
                Votre plan sera activé dans les <strong className="text-white">2 à 24 heures</strong> après vérification du virement par notre équipe.
              </p>
              <div className="bg-[#000000] border border-[#2a2a38] rounded-xl p-3 mb-5">
                <p className="text-xs text-[#8888A8] mb-1">Votre référence de paiement</p>
                <p className="font-mono text-sm font-bold text-[#7B7BFF]">{reference}</p>
              </div>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white text-sm font-semibold transition-all shadow-[0_0_16px_rgba(91,91,214,0.35)]">
                Fermer
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-[#1e1e2a]">
                <button
                  onClick={() => setTab("qr")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors",
                    tab === "qr" ? "text-[#7B7BFF] border-b-2 border-[#5B5BD6]" : "text-[#8888A8] hover:text-white"
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  QR Code
                </button>
                <button
                  onClick={() => setTab("virement")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors",
                    tab === "virement" ? "text-[#7B7BFF] border-b-2 border-[#5B5BD6]" : "text-[#8888A8] hover:text-white"
                  )}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Virement bancaire
                </button>
                <button
                  onClick={() => setTab("paypal")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors",
                    tab === "paypal" ? "text-[#7B7BFF] border-b-2 border-[#5B5BD6]" : "text-[#8888A8] hover:text-white"
                  )}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  PayPal
                </button>
              </div>

              <div className="p-5">
                {tab === "qr" ? (
                  <div className="flex flex-col items-center gap-4">
                    {ibanConfigured ? (
                      <>
                        <p className="text-xs text-[#8888A8] text-center">
                          Scannez ce QR code avec votre application bancaire. Il contient toutes les informations du virement.
                        </p>
                        <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(91,91,214,0.2)]">
                          <QRCodeSVG value={qrLines} size={200} level="M" includeMargin={false} />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <div className="w-12 h-12 rounded-xl bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-[#7B7BFF]" />
                        </div>
                        <p className="text-sm text-white font-semibold text-center">Coordonnées bancaires non configurées</p>
                        <p className="text-xs text-[#8888A8] text-center leading-relaxed max-w-xs">
                          L'administrateur doit configurer les variables <code className="text-[#7B7BFF]">PAYMENT_IBAN</code> ou <code className="text-[#7B7BFF]">PAYMENT_PHONE</code> dans les secrets Replit.
                        </p>
                      </div>
                    )}
                    <div className="w-full bg-[#000000] border border-[#2a2a38] rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8888A8]">Montant</span>
                        <span className="text-sm font-bold text-white">{plan.price} Dh</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8888A8]">Référence (obligatoire)</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-[#7B7BFF]">{reference}</span>
                          <button onClick={() => copy(reference, "ref-qr")} className="text-[#8888A8] hover:text-white transition-colors">
                            {copied === "ref-qr" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : tab === "virement" ? (
                  <div className="space-y-3">
                    <p className="text-xs text-[#8888A8]">Effectuez un virement avec les informations suivantes :</p>
                    {[
                      { label: "Bénéficiaire", value: config.holder, key: "holder", show: !!config.holder },
                      { label: "Banque", value: config.bank, key: "bank", show: !!config.bank },
                      { label: "IBAN / RIB", value: config.iban, key: "iban", show: !!config.iban },
                      { label: "Paiement mobile", value: config.phone, key: "phone", show: !!config.phone },
                      { label: "Montant", value: `${plan.price} Dh`, key: "amount", show: true },
                      { label: "Référence (obligatoire)", value: reference, key: "ref2", show: true },
                    ].filter(f => f.show).map(({ label, value, key }) => (
                      <div key={key} className="bg-[#000000] border border-[#2a2a38] rounded-xl p-3">
                        <p className="text-[10px] text-[#8888A8] mb-1">{label}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "text-sm font-medium break-all font-mono",
                            key === "ref2" ? "text-[#7B7BFF]" : key === "iban" ? "text-white tracking-wide" : "text-white"
                          )}>
                            {key === "iban" && !ibanRevealed ? maskIban(value) : value}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {key === "iban" && (
                              <button
                                onClick={() => setIbanRevealed((v) => !v)}
                                className="text-[#8888A8] hover:text-white transition-colors"
                                aria-label={ibanRevealed ? "Masquer le RIB" : "Afficher le RIB"}
                              >
                                {ibanRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <button onClick={() => copy(value, key)} className="text-[#8888A8] hover:text-white transition-colors">
                              {copied === key ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!ibanConfigured && (
                      <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-yellow-300 leading-relaxed">
                          Configurez <code>PAYMENT_IBAN</code> ou <code>PAYMENT_PHONE</code> dans les secrets Replit pour afficher vos coordonnées bancaires.
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2 bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 rounded-xl p-3">
                      <AlertCircle className="w-3.5 h-3.5 text-[#7B7BFF] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#9B9BFF] leading-relaxed">
                        La <strong>référence est obligatoire</strong> dans le motif du virement pour que votre plan soit activé.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-12 h-12 rounded-xl bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-[#7B7BFF]" />
                    </div>
                    <p className="text-sm text-white font-semibold text-center">PayPal — bientôt disponible</p>
                    <p className="text-xs text-[#8888A8] text-center leading-relaxed max-w-xs">
                      Le paiement par PayPal arrive prochainement. En attendant, utilise le QR code ou le virement bancaire.
                    </p>
                  </div>
                )}

                {tab !== "paypal" && (
                  <>
                    <button
                      onClick={handleConfirm}
                      className="w-full mt-5 py-3 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white text-sm font-semibold transition-all shadow-[0_0_16px_rgba(91,91,214,0.35)] flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      J'ai effectué le virement
                    </button>
                    <p className="text-center text-[10px] text-[#5555A8] mt-2">
                      Activation sous 2 à 24h après vérification par notre équipe
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
