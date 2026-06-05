import { useState, useRef, useEffect } from "react";
import { Paperclip, SendHorizonal } from "lucide-react";
import { AnthropicMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListAnthropicMessagesQueryKey,
  getListAnthropicConversationsQueryKey,
} from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "./markdown";
import { SharkCoding } from "./shark-coding";
import { ProjectPreview } from "./project-preview";
import { MediaPlayer } from "./media-player";
import { GradoLogo } from "./grado-logo";
import { extractHtml } from "@/lib/extract-html";
import { extractMediaTag, stripMediaTag } from "@/lib/extract-media";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface ChatAreaProps {
  conversationId: number | null;
  setConversationId: (id: number) => void;
  messages: AnthropicMessage[];
  onTitleCreate: (title: string) => Promise<number>;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  onRunStart: () => void;
  onRunEnd: () => void;
  isRunning: boolean;
}

interface MediaJob {
  prompt: string;
  mediaId: number;
  type: "music" | "video";
}

function WelcomeInner({ setInput }: { setInput: (v: string) => void }) {
  const { t } = useI18n();
  const chips = [
    { label: t.chip1, value: "make me a chill lo-fi beat" },
    { label: t.chip2, value: "generate a video of an ocean at sunset" },
    { label: t.chip3, value: "build me a beautiful todo app" },
  ];
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">{t.chatWelcome}</h1>
        <p className="text-sm text-[#8888A8]">{t.chatSub}</p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center mt-2">
        {chips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setInput(chip.value)}
            className="text-xs px-3 py-1.5 rounded-full bg-[#18181f] border border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/40 transition-colors"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </>
  );
}

export function ChatArea({
  conversationId,
  setConversationId,
  messages,
  onTitleCreate,
  toggleSidebar,
  isSidebarOpen,
  onRunStart,
  onRunEnd,
  isRunning,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<AnthropicMessage[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [mediaJobs, setMediaJobs] = useState<MediaJob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setActiveId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, isRunning]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerMediaGeneration = async (
    currentId: number,
    type: "music" | "video",
    prompt: string
  ) => {
    // Don't trigger if already in progress/done for this prompt
    if (mediaJobs.find((j) => j.prompt === prompt)) return;

    try {
      const endpoint = type === "music" ? "/api/media/music" : "/api/media/video";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentId,
          prompt,
          durationSeconds: 22,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMediaJobs((prev) => [...prev, { prompt, mediaId: data.id, type }]);
      } else {
        const err = await res.json();
        if (err.error === "ELEVENLABS_API_KEY not configured" || err.error === "FAL_KEY not configured") {
          setMediaJobs((prev) => [...prev, { prompt, mediaId: -1, type }]);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isRunning) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    let currentId = activeId;
    if (!currentId) {
      const title = content.length > 40 ? content.substring(0, 40) + "..." : content;
      const newId = await onTitleCreate(title);
      currentId = newId;
      setActiveId(newId);
      setConversationId(newId);
    }

    const userMsg: AnthropicMessage = {
      id: Date.now(),
      conversationId: currentId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    onRunStart();

    try {
      const res = await fetch(`/api/anthropic/conversations/${currentId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) fullText += data.content;
            } catch {
              // ignore partial JSON
            }
          }
        }
      }

      if (fullText) {
        const newMsgId = Date.now() + 1;
        const newMsg: AnthropicMessage = {
          id: newMsgId,
          conversationId: currentId!,
          role: "assistant",
          content: fullText,
          createdAt: new Date().toISOString(),
        };
        setLocalMessages((prev) => [...prev, newMsg]);

        // Detect and trigger media generation
        const mediaTag = extractMediaTag(fullText);
        if (mediaTag && currentId) {
          await triggerMediaGeneration(currentId, mediaTag.type, mediaTag.prompt);
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setLocalMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          conversationId: currentId!,
          role: "assistant",
          content: "Une erreur est survenue. Réessaie.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      onRunEnd();
      queryClient.invalidateQueries({ queryKey: getListAnthropicMessagesQueryKey(currentId!) });
      queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const showWelcome = !activeId && localMessages.length === 0 && !isRunning;

  return (
    <div className="flex flex-col h-full bg-[#0D0D12]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl w-full mx-auto flex flex-col gap-4">
          {showWelcome ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center gap-4">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#5B5BD6]/30 rounded-2xl blur-2xl scale-150" />
                <GradoLogo size={64} className="relative" />
              </motion.div>
              <WelcomeInner setInput={setInput} />
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {localMessages.map((msg) => {
                  const html = msg.role === "assistant" ? extractHtml(msg.content) : null;
                  const mediaTag = msg.role === "assistant" ? extractMediaTag(msg.content) : null;
                  const displayContent = mediaTag ? stripMediaTag(msg.content) : msg.content;
                  const mediaJob = mediaTag ? mediaJobs.find((j) => j.prompt === mediaTag.prompt) : undefined;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                      data-testid={`message-${msg.role}-${msg.id}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-[#0e0e16] border border-[#5B5BD6]/30 flex items-center justify-center mr-2 mt-1 shrink-0 shadow-[0_0_8px_rgba(91,91,214,0.2)]">
                          <GradoLogo size={20} />
                        </div>
                      )}

                      <div className={cn("flex flex-col", msg.role === "assistant" ? "flex-1 min-w-0" : "max-w-[80%]")}>
                        {/* Show text bubble if there's non-media content */}
                        {(!mediaTag || displayContent) && (
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 text-sm",
                              msg.role === "user"
                                ? "bg-[#5B5BD6] text-white rounded-br-sm"
                                : "bg-[#18181f] border border-[#2a2a38] text-[#E8E8F0] rounded-bl-sm"
                            )}
                          >
                            {msg.role === "user" ? (
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            ) : (
                              <MarkdownRenderer content={displayContent} />
                            )}
                          </div>
                        )}

                        {/* Live project preview */}
                        {html && activeId && (
                          <ProjectPreview html={html} conversationId={activeId} />
                        )}

                        {/* Media player */}
                        {mediaJob && mediaJob.mediaId > 0 && (
                          <MediaPlayer
                            type={mediaJob.type}
                            mediaId={mediaJob.mediaId}
                            prompt={mediaJob.prompt}
                          />
                        )}

                        {/* API key not configured warning */}
                        {mediaJob && mediaJob.mediaId === -1 && (
                          <div className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-400/80">
                            {mediaJob.type === "music"
                              ? "⚠️ Clé API ElevenLabs manquante. Ajoute ELEVENLABS_API_KEY dans les secrets."
                              : "⚠️ Clé API FAL manquante. Ajoute FAL_KEY dans les secrets."}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <AnimatePresence>
                {isRunning && (
                  <motion.div
                    key="shark"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0e0e16] border border-[#5B5BD6]/30 flex items-center justify-center mr-2 mt-1 shrink-0 shadow-[0_0_8px_rgba(91,91,214,0.2)]">
                      <GradoLogo size={20} />
                    </div>
                    <div className="bg-[#18181f] border border-[#2a2a38] rounded-2xl rounded-bl-sm px-5 py-3">
                      <SharkCoding />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-[#2a2a38] bg-[#111118] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#8888A8] shrink-0 rounded-lg hover:text-white"
            data-testid="button-attachment"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <div className="flex-1 bg-[#18181f] border border-[#2a2a38] rounded-xl focus-within:border-[#5B5BD6]/60 transition-colors">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Build an app, generate a song, create a video..."
              className="min-h-[40px] max-h-[160px] border-0 focus-visible:ring-0 resize-none bg-transparent px-4 py-2.5 text-[#E8E8F0] text-sm placeholder:text-[#8888A8]"
              rows={1}
              disabled={isRunning}
              data-testid="input-message"
            />
          </div>

          <Button
            size="icon"
            className={cn(
              "h-9 w-9 shrink-0 rounded-lg transition-all duration-150",
              input.trim() && !isRunning
                ? "bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white shadow-[0_0_14px_rgba(91,91,214,0.5)]"
                : "bg-[#1e1e2a] text-[#8888A8] cursor-not-allowed"
            )}
            disabled={!input.trim() || isRunning}
            onClick={handleSend}
            data-testid="button-send"
          >
            <SendHorizonal className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-center text-[10px] text-[#8888A8]/60 mt-2">
          Grado can build apps, compose music, and generate videos.
        </p>
      </div>
    </div>
  );
}
