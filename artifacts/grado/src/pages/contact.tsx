import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, MessageCircle, Send } from "lucide-react";
import { GradoLogo } from "@/components/grado-logo";

const SUPPORT_EMAIL = "grado.safi@gmail.com";

export default function ContactPage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const canSend = email.trim().length > 3 && message.trim().length > 0;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    const body = `Nom: ${name || "-"}\nEmail: ${email}\n\n${message}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject || "Demande de support Grado"
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e1e2a]/80 bg-[#000000]/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5">
            <GradoLogo size={22} />
            <span className="text-sm font-bold tracking-tight">Grado</span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 pt-28 pb-24">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#5B5BD6]/15 border border-[#5B5BD6]/30 flex items-center justify-center">
            <MessageCircle className="w-4.5 h-4.5 text-[#5B5BD6]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Contact & support</h1>
        </div>
        <p className="text-sm text-[#8888A8] mb-10">
          Une question sur ton compte, un abonnement, un paiement ou un bug ? Écris-nous, on te répond au plus vite.
        </p>

        <div className="mb-8 flex items-center gap-2 text-sm text-[#A0A0B8] bg-[#0a0a0f] border border-[#1e1e2a] rounded-xl px-4 py-3">
          <Mail className="w-4 h-4 text-[#5B5BD6] shrink-0" />
          <span>
            Tu peux aussi nous écrire directement à{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#7B7BFF] hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </span>
        </div>

        <form onSubmit={handleSend} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-[#A0A0B8] mb-1.5">Nom</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ton nom"
                className="w-full bg-[#0a0a0f] border border-[#1e1e2a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#5a5a70] focus:outline-none focus:border-[#5B5BD6]/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#A0A0B8] mb-1.5">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                className="w-full bg-[#0a0a0f] border border-[#1e1e2a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#5a5a70] focus:outline-none focus:border-[#5B5BD6]/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#A0A0B8] mb-1.5">Sujet</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex : Problème de paiement, bug, question sur un plan..."
              className="w-full bg-[#0a0a0f] border border-[#1e1e2a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#5a5a70] focus:outline-none focus:border-[#5B5BD6]/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[#A0A0B8] mb-1.5">Message *</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décris ta demande..."
              rows={6}
              className="w-full bg-[#0a0a0f] border border-[#1e1e2a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#5a5a70] focus:outline-none focus:border-[#5B5BD6]/60 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex items-center gap-2 bg-[#5B5BD6] hover:bg-[#4a4ac4] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-[0_0_24px_rgba(91,91,214,0.35)]"
          >
            <Send className="w-4 h-4" />
            Envoyer le message
          </button>
        </form>
      </main>

      <footer className="border-t border-[#1e1e2a] py-8 px-5">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <GradoLogo size={20} />
            <span className="text-sm font-semibold">Grado</span>
          </div>
          <div className="flex gap-6">
            <button onClick={() => navigate("/terms")} className="text-xs text-[#8888A8] hover:text-white transition-colors">CGU</button>
            <button onClick={() => navigate("/privacy")} className="text-xs text-[#8888A8] hover:text-white transition-colors">Confidentialité</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
