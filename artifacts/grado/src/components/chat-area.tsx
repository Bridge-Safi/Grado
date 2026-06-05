import { useState, useRef, useEffect } from "react";
import { Play, Paperclip, PanelLeftOpen } from "lucide-react";
import { AnthropicMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { getListAnthropicMessagesQueryKey, getListAnthropicConversationsQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "./markdown";
import { SharkCoding } from "./shark-coding";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  conversationId: number | null;
  setConversationId: (id: number) => void;
  messages: AnthropicMessage[];
  onTitleCreate: (title: string) => Promise<number>;
  logoUrl: string;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function ChatArea({
  conversationId,
  setConversationId,
  messages,
  onTitleCreate,
  logoUrl,
  toggleSidebar,
  isSidebarOpen,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [localMessages, setLocalMessages] = useState<AnthropicMessage[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Sync activeId with parent conversationId when parent changes (e.g. sidebar click)
  useEffect(() => {
    setActiveId(conversationId);
  }, [conversationId]);

  // Sync messages from parent into local when switching conversations
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isStreaming) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Determine or create conversation
    let currentId = activeId;
    if (!currentId) {
      const title = content.length > 40 ? content.substring(0, 40) + "..." : content;
      const newId = await onTitleCreate(title);
      currentId = newId;
      setActiveId(newId);
      setConversationId(newId);
    }

    // Optimistically add user message to local state immediately
    const userMsg: AnthropicMessage = {
      id: Date.now(),
      conversationId: currentId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

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
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullText += data.content;
              }
              if (data.done) break;
            } catch {
              // ignore partial JSON
            }
          }
        }
      }

      // Add final assistant message to local state
      if (fullText) {
        const assistantMsg: AnthropicMessage = {
          id: Date.now() + 1,
          conversationId: currentId,
          role: "assistant",
          content: fullText,
          createdAt: new Date().toISOString(),
        };
        setLocalMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error("Streaming error:", error);
      const errMsg: AnthropicMessage = {
        id: Date.now() + 1,
        conversationId: currentId,
        role: "assistant",
        content: "Something went wrong. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsStreaming(false);
      // Refresh server data in background
      queryClient.invalidateQueries({
        queryKey: getListAnthropicMessagesQueryKey(currentId!),
      });
      queryClient.invalidateQueries({
        queryKey: getListAnthropicConversationsQueryKey(),
      });
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const showWelcome = !activeId && localMessages.length === 0 && !isStreaming;
  const hasContent = localMessages.length > 0 || isStreaming;

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Top bar */}
      <header className="h-14 border-b border-border flex items-center px-4 shrink-0 bg-background/95 backdrop-blur z-10 sticky top-0">
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 text-muted-foreground"
            onClick={toggleSidebar}
            data-testid="button-toggle-sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="Grado" className="w-5 h-5 object-contain opacity-60" />
          {activeId && (
            <span className="text-sm text-muted-foreground">
              Chat #{activeId}
            </span>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col"
      >
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
          {showWelcome ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-6 shadow-xl shadow-primary/5"
              >
                <img src={logoUrl} alt="Grado" className="w-8 h-8 object-contain" />
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-2">
                Hi, what do you want to build?
              </h1>
              <p className="text-muted-foreground max-w-sm">
                Describe your idea and Grado will build it for you.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              <AnimatePresence initial={false}>
                {localMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                    data-testid={`message-${msg.role}-${msg.id}`}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-5 py-3.5",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border border-border text-foreground rounded-tl-sm shadow-sm"
                      )}
                    >
                      {msg.role === "user" ? (
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Shark coding animation while waiting */}
              <AnimatePresence>
                {isStreaming && (
                  <motion.div
                    key="shark"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex justify-start"
                  >
                    <div className="bg-card border border-border rounded-2xl rounded-tl-sm shadow-sm px-6 py-2">
                      <SharkCoding />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 bg-background shrink-0">
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl transition-all opacity-0 group-focus-within:opacity-100" />
          <div className="relative bg-card border border-border rounded-xl shadow-lg focus-within:border-primary/50 transition-colors flex items-end p-2 gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground shrink-0 rounded-lg"
              data-testid="button-attachment"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              className="min-h-[40px] max-h-[200px] border-0 focus-visible:ring-0 resize-none bg-transparent p-2 text-foreground text-sm"
              rows={1}
              disabled={isStreaming}
              data-testid="input-message"
            />

            <Button
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 rounded-lg transition-all duration-200",
                input.trim() && !isStreaming
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(91,91,214,0.45)] hover:shadow-[0_0_22px_rgba(91,91,214,0.7)] hover:scale-105"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              )}
              disabled={!input.trim() || isStreaming}
              onClick={handleSend}
              data-testid="button-run"
            >
              <Play className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground">
              Grado can make mistakes. Consider verifying critical code.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
