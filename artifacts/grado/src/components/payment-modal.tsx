import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, Clock, CreditCard, Building2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface PaymentModalProps {
  plan: Plan;
  onClose: () => void;
  onSuccess: () => void;
}

const BANK_IBAN = import.meta.env.VITE_PAYMENT_IBAN || "À configurer par l'admin";
const BANK_HOLDER = import.meta.env.VITE_PAYMENT_HOLDER || "Grado";
const BANK_PHONE = import.meta.env.VITE_PAYMENT_PHONE || "";

export function PaymentModal({ plan, onClose, onSuccess }: PaymentModalProps) {
  const { token } = useAuth();
  const [tab, setTab] = useState<"qr" | "virement">("qr");
  const [reference, setReference] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    createRequest();
  }, []);

  const createRequest = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setReference(data.reference);
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

  const qrData = [
    `GRADO PAYMENT`,
    `Bénéficiaire: ${BANK_HOLDER}`,
    `IBAN/RIB: ${BANK_IBAN}`,
    BANK_PHONE ? `Mobile: ${BANK_PHONE}` : "",
    `Montant: ${plan.price} DH`,
    `Référence: ${reference}`,
    `Plan: ${plan.name}`,
  ].filter(Boolean).join("\n");

  const handleConfirm = () => {
    setSubmitted(true);
    onSuccess();
  };

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
          className="relative bg-[#111118] border border-[#2a2a38] rounded-2xl w-full max-w-md shadow-[0_0_80px_rgba(91,91,214,0.2)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2a]">
            <div>
              <h2 className="font-bold text-white text-base">Paiement — Plan {plan.name}</h2>
              <p className="text-xs text-[#8888A8] mt-0.5">{plan.price} Dh/mois</p>
            </div>
            <button onClick={onClose} className="text-[#8888A8] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-[#8888A8]">
              <Loader2 className="w-5 h-5 animate-spin text-[#5B5BD6]" />
              <span className="text-sm">Génération de votre référence…</span>
            </div>
          ) : error ? (
            <div className="p-5">
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          ) : submitted ? (
            <div className="p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-[#5B5BD6]/15 border border-[#5B5BD6]/30 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-[#5B5BD6]" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Demande envoyée !</h3>
              <p className="text-sm text-[#8888A8] leading-relaxed mb-4">
                Votre demande de paiement est en cours de vérification. Votre plan sera activé dans les <strong className="text-white">2 à 24 heures</strong> après confirmation du virement.
              </p>
              <div className="bg-[#0D0D12] border border-[#2a2a38] rounded-xl p-3 mb-4">
                <p className="text-xs text-[#8888A8] mb-1">Votre référence</p>
                <p className="font-mono text-sm font-bold text-[#7B7BFF]">{reference}</p>
              </div>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white text-sm font-semibold transition-all">
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
                    tab === "qr"
                      ? "text-[#7B7BFF] border-b-2 border-[#5B5BD6]"
                      : "text-[#8888A8] hover:text-white"
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  QR Code
                </button>
                <button
                  onClick={() => setTab("virement")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors",
                    tab === "virement"
                      ? "text-[#7B7BFF] border-b-2 border-[#5B5BD6]"
                      : "text-[#8888A8] hover:text-white"
                  )}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Virement bancaire
                </button>
              </div>

              <div className="p-5">
                {tab === "qr" ? (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-xs text-[#8888A8] text-center">
                      Scannez ce QR code avec votre application bancaire pour effectuer le paiement automatiquement.
                    </p>
                    <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(91,91,214,0.2)]">
                      <QRCodeSVG
                        value={qrData}
                        size={200}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <div className="w-full bg-[#0D0D12] border border-[#2a2a38] rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8888A8]">Montant</span>
                        <span className="text-sm font-bold text-white">{plan.price} Dh</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8888A8]">Référence</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-[#7B7BFF]">{reference}</span>
                          <button onClick={() => copy(reference, "ref")} className="text-[#8888A8] hover:text-white transition-colors">
                            {copied === "ref" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#5555A8] text-center">
                      Assurez-vous d'inclure la référence dans le commentaire du virement
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-[#8888A8]">
                      Effectuez un virement bancaire avec les informations suivantes :
                    </p>
                    {[
                      { label: "Bénéficiaire", value: BANK_HOLDER, key: "holder" },
                      { label: "IBAN / RIB", value: BANK_IBAN, key: "iban" },
                      ...(BANK_PHONE ? [{ label: "Paiement mobile", value: BANK_PHONE, key: "phone" }] : []),
                      { label: "Montant", value: `${plan.price} Dh`, key: "amount" },
                      { label: "Référence (obligatoire)", value: reference, key: "ref2" },
                    ].map(({ label, value, key }) => (
                      <div key={key} className="bg-[#0D0D12] border border-[#2a2a38] rounded-xl p-3">
                        <p className="text-[10px] text-[#8888A8] mb-1">{label}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "text-sm font-medium break-all",
                            key === "ref2" ? "font-mono text-[#7B7BFF]" : "text-white"
                          )}>
                            {value}
                          </span>
                          <button onClick={() => copy(value, key)} className="shrink-0 text-[#8888A8] hover:text-white transition-colors">
                            {copied === key ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-start gap-2 bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 rounded-xl p-3 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-[#7B7BFF] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#9B9BFF] leading-relaxed">
                        La référence est <strong>obligatoire</strong> dans le motif du virement pour que votre plan soit activé automatiquement.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleConfirm}
                  className="w-full mt-5 py-3 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white text-sm font-semibold transition-all shadow-[0_0_16px_rgba(91,91,214,0.35)] flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  J'ai effectué le virement
                </button>
                <p className="text-center text-[10px] text-[#5555A8] mt-2">
                  Activation sous 2 à 24h après vérification
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
