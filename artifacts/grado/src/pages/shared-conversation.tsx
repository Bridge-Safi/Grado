import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { GradoLogo } from "@/components/grado-logo";
import { MarkdownRenderer } from "@/components/markdown";
import { extractHtml } from "@/lib/extract-html";
import { ProjectPreview } from "@/components/project-preview";
import { cn } from "@/lib/utils";

interface SharedMessage {
  role: string;
  content: string;
  createdAt: string;
}

export default function SharedConversationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [msgs, setMsgs] = useState<SharedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/share/view/${slug}`)
      .then(r => r.ok ? r.json() : r.json().then((e: any) => { throw new Error(e.error); }))
      .then(data => { setTitle(data.title); setMsgs(data.messages); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <GradoLogo size={28} />
          <span className="font-bold text-white text-lg">Grado</span>
          <span className="text-[#8888A8] text-sm ml-2">· Conversation partagée</span>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#5B5BD6] animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-20 space-y-4">
            <p className="text-red-400">{error}</p>
            <button onClick={() => navigate("/")} className="text-[#7B7BFF] hover:underline">
              <ArrowLeft className="inline w-4 h-4 mr-1" />Retour à Grado
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
            <div className="flex flex-col gap-4">
              {msgs.map((msg, i) => {
                const html = msg.role === "assistant" ? extractHtml(msg.content) : null;
                const displayContent = html ? msg.content.split(/```html/i)[0].trim() : msg.content;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-[#0e0e16] border border-[#5B5BD6]/30 flex items-center justify-center mr-2 mt-1 shrink-0">
                        <GradoLogo size={18} />
                      </div>
                    )}
                    <div className={cn("flex flex-col gap-2", msg.role === "assistant" ? "flex-1 min-w-0" : "max-w-[80%]")}>
                      {(!html || displayContent) && (
                        <div className={cn(
                          "rounded-2xl px-4 py-3 text-sm",
                          msg.role === "user"
                            ? "bg-[#5B5BD6] text-white rounded-br-sm"
                            : "bg-[#0A0A0A] border border-[#2a2a38] text-[#E8E8F0] rounded-bl-sm"
                        )}>
                          {msg.role === "user"
                            ? <p className="whitespace-pre-wrap">{msg.content}</p>
                            : <MarkdownRenderer content={displayContent} />}
                        </div>
                      )}
                      {html && (
                        <ProjectPreview html={html} conversationId={0} />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-12 text-center border-t border-[#2a2a38] pt-6">
              <p className="text-[#8888A8] text-sm mb-3">Crée tes propres apps, musiques et vidéos avec Grado</p>
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-2.5 bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(91,91,214,0.4)]"
              >
                Créer mon compte
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
