import { useState, useRef, useEffect } from "react";
import { Paperclip, SendHorizonal, Globe, Palette, GalleryHorizontal, Sparkles, BarChart3, Gamepad2, FileText, X, Zap, Brain, Code2, Lightbulb, BarChart2, Users, Mic, MicOff, ChevronDown, ChevronUp, Lock, RefreshCw, GripVertical, Download, ExternalLink, CheckCheck, Rocket, Maximize2, Minimize2 } from "lucide-react";
import { AgentOrchestrator } from "./agent-orchestrator";
import { AnthropicMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  getListAnthropicMessagesQueryKey,
  getListAnthropicConversationsQueryKey,
} from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "./markdown";
import { SharkCoding, AgentAvatar } from "./shark-coding";
import { PreviewLoadingScreen } from "./preview-loading";
import { PublishModal } from "./publish-modal";
import { usePublish } from "@/hooks/use-publish";
import { MediaPlayer } from "./media-player";
import { ImagePlayer } from "./image-player";
import { GradoLogo } from "./grado-logo";
import { extractHtml, extractHtmlLoose } from "@/lib/extract-html";
import { extractMediaTag, stripMediaTag } from "@/lib/extract-media";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { ShareButton } from "./share-button";
import { GithubMenu } from "./github-menu";

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
  /** Increment to re-run the last user message */
  runTrigger?: number;
}

interface MediaJob {
  prompt: string;
  mediaId: number;
  type: "music" | "video" | "image";
  title?: string;
  genre?: string;
  lyrics?: string;
  quotaError?: string;
}


type AgentMode = "general" | "dev" | "design" | "analyse" | "tutor" | "writer" | "translate" | "philosophy" | "casual";
type ModelChoice = "haiku" | "sonnet" | "gemini" | "mistral" | "llama";

const AGENTS: { id: AgentMode; label: string; icon: React.ElementType; desc: string; group?: string }[] = [
  { id: "general",    label: "Général",     icon: Sparkles,  desc: "Agent polyvalent",              group: "Création" },
  { id: "dev",        label: "Dev",         icon: Code2,     desc: "Code & applications",           group: "Création" },
  { id: "design",     label: "Design",      icon: Palette,   desc: "UI/UX & animations",            group: "Création" },
  { id: "analyse",    label: "Analyse",     icon: BarChart2, desc: "Données & rapports",            group: "Création" },
  { id: "tutor",      label: "Tuteur",      icon: Lightbulb, desc: "Explications & cours",          group: "Création" },
  { id: "writer",     label: "Rédaction",   icon: FileText,  desc: "Articles, essais, contenus",    group: "Connaissance" },
  { id: "translate",  label: "Traduction",  icon: Globe,     desc: "Traduit & corrige la grammaire",group: "Connaissance" },
  { id: "philosophy", label: "Expert",      icon: Brain,     desc: "Philo, histoire, droit, santé", group: "Connaissance" },
  { id: "casual",     label: "Discussion",  icon: Users,     desc: "Conversation libre & détente",  group: "Connaissance" },
];

const BUILD_KEYWORDS = /créer?|crée|creer|build|constru|développe|genère|générer|génère|app|site|jeu|game|dashboard|landing|animation|présentation|rapport|code|projet/i;

const CATEGORIES = [
  { label: "App web",       icon: Globe,             prompt: "Crée une app web " },
  { label: "Mini-jeu",      icon: Gamepad2,          prompt: "Crée un mini-jeu " },
  { label: "Présentation",  icon: GalleryHorizontal, prompt: "Crée une présentation sur " },
  { label: "Dashboard",     icon: BarChart3,         prompt: "Crée un dashboard avec des graphiques pour " },
  { label: "Animation",     icon: Sparkles,          prompt: "Crée une animation visuelle " },
  { label: "Landing page",  icon: Palette,           prompt: "Crée une landing page moderne pour " },
  { label: "Rapport",       icon: FileText,          prompt: "Rédige un rapport professionnel sur " },
];

function WelcomeInner({ setInput, focusInput }: { setInput: (v: string) => void; focusInput: () => void }) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleCategory = (cat: typeof CATEGORIES[0]) => {
    setActiveCategory(cat.label);
    setInput(cat.prompt);
    focusInput();
  };

  const firstName = user?.name?.split(" ")[0] ?? "toi";

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-white mb-1">
          Salut {firstName},
        </h1>
        <p className="text-xl text-[#8888A8] font-light">Qu'est-ce que tu veux créer ?</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mt-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => handleCategory(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border",
                isActive
                  ? "bg-[#5B5BD6]/15 border-[#5B5BD6]/50 text-white shadow-[0_0_12px_rgba(91,91,214,0.2)]"
                  : "bg-[#0A0A0A] border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/30 hover:bg-[#1a1a2a]"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
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
  runTrigger,
}: ChatAreaProps) {
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<AnthropicMessage[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [mediaJobs, setMediaJobs] = useState<MediaJob[]>([]);
  const [msgImageMap, setMsgImageMap] = useState<Record<number, string>>({});
  const [liveAgentCode, setLiveAgentCode] = useState<string>("");
  const liveCodeRef = useRef<HTMLPreElement>(null);
  // Dernier HTML généré avec succès — évite le clignotement entre live et final
  const [lastCompletedHtml, setLastCompletedHtml] = useState<string | null>(null);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Model & agent
  const [model, setModel] = useState<ModelChoice>("haiku");
  const [agentMode, setAgentMode] = useState<AgentMode>("general");
  const [showAgents, setShowAgents] = useState(false);

  // Multi-agent mode
  const [isMultiAgent, setIsMultiAgent] = useState(false);
  const [multiAgentPrompt, setMultiAgentPrompt] = useState("");

  // Reflection mode (think before answering)
  const [reflectionMode, setReflectionMode] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [expandedThinking, setExpandedThinking] = useState<Record<number, boolean>>({});
  // Messages whose short accompanying text (next to a generated HTML preview) was expanded via "Voir plus"
  const [expandedHtmlText, setExpandedHtmlText] = useState<Record<number, boolean>>({});

  // Track if current request is a build (vs quick question)
  const [isBuilding, setIsBuilding] = useState(false);

  // More options menu
  const [showMore, setShowMore] = useState(false);

  // Voice input
  const { isListening, start: startListening, stop: stopListening } = useVoiceInput((text) => {
    setInput(prev => prev ? prev + " " + text : text);
  });

  const { token, user } = useAuth();
  const { t, rtl } = useI18n();
  const isPaidUser = user?.plan && user.plan !== "gratuit";
  const sonnetAllowed = !!((user as any)?.isAdmin || (user?.plan && ["createur", "fusion", "elite"].includes(user.plan)));

  const [streamText, setStreamText] = useState("");
  const [previewTab, setPreviewTab] = useState<"apercu" | "code">("apercu");
  const [previewKey, setPreviewKey] = useState(0);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 550;
    const saved = Number(localStorage.getItem("grado_preview_width"));
    return saved && saved > 0 ? saved : 550;
  });
  const resizingRef = useRef(false);
  const handlePreviewResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    const startX = e.clientX;
    const startWidth = previewWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = ev.clientX - startX;
      const maxWidth = Math.max(360, window.innerWidth - 420);
      const next = Math.min(Math.max(startWidth - delta, 320), maxWidth);
      setPreviewWidth(next);
    };
    const onUp = () => {
      resizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setPreviewWidth((w) => {
        localStorage.setItem("grado_preview_width", String(w));
        return w;
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setActiveId(conversationId);
    setLastCompletedHtml(null); // reset preview on conversation switch
    setPreviewKey((k) => k + 1); // force iframe remount on conversation switch
  }, [conversationId]);

  useEffect(() => {
    // Don't overwrite locally-built messages while multi-agent is active
    if (!isMultiAgent) setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, isRunning]);

  // Re-run last user message when Run button is clicked from parent
  useEffect(() => {
    if (!runTrigger) return;
    const lastUserMsg = [...localMessages].reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    } else if (input.trim()) {
      handleSend();
    }
  }, [runTrigger]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File / image picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // dataUrl = "data:<mime>;base64,<data>"
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      setImageMime(mime);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageMime("image/jpeg");
  };

  const triggerMediaGeneration = async (
    currentId: number,
    type: "music" | "video" | "image",
    prompt: string,
    title?: string,
    genre?: string,
    lyrics?: string
  ) => {
    if (mediaJobs.find((j) => j.prompt === prompt)) return;
    try {
      const endpoint =
        type === "music" ? "/api/media/music" :
        type === "image" ? "/api/media/image" :
        "/api/media/video";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentId,
          prompt,
          lyrics,
          genre,
          durationSeconds: isPaidUser ? 180 : 60,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMediaJobs((prev) => [...prev, { prompt, mediaId: data.id, type, title, genre, lyrics }]);
      } else {
        const err = await res.json();
        if (
          err.error === "FREE_MUSIC_QUOTA_REACHED" ||
          err.error === "FREE_VIDEO_QUOTA_REACHED" ||
          err.error === "PLAN_VIDEO_QUOTA_REACHED" ||
          err.error === "PLAN_VIDEO_MONTHLY_CAP_REACHED"
        ) {
          setMediaJobs((prev) => [...prev, { prompt, mediaId: -2, type, title, genre, lyrics, quotaError: err.error }]);
        } else if (
          err.error === "ELEVENLABS_API_KEY not configured" ||
          err.error === "FAL_KEY not configured" ||
          err.error === "No music API configured"
        ) {
          setMediaJobs((prev) => [...prev, { prompt, mediaId: -1, type, title, genre, lyrics }]);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async (overrideContent?: string) => {
    const content = (typeof overrideContent === "string" ? overrideContent : input).trim();
    if (!content || isRunning) return;

    setIsMultiAgent(false);
    setStreamText("");
    if (!overrideContent) {
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }

    // Snapshot & clear image
    const sentImageBase64 = imageBase64;
    const sentImageMime = imageMime;
    const sentImagePreview = imagePreview;
    clearImage();

    // Add the user message immediately so the chat never feels frozen
    const userMsgId = Date.now();
    const userMsg: AnthropicMessage & { imagePreview?: string } = {
      id: userMsgId,
      conversationId: activeId ?? 0,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      imagePreview: sentImagePreview ?? undefined,
    } as any;
    if (sentImagePreview) {
      setMsgImageMap((prev) => ({ ...prev, [userMsgId]: sentImagePreview }));
    }
    setLocalMessages((prev) => [...prev, userMsg]);
    setIsBuilding(BUILD_KEYWORDS.test(content) || agentMode === "dev" || agentMode === "design");
    onRunStart();

    let currentId = activeId;

    try {
      // Create conversation if needed — inside try so errors are caught and shown
      if (!currentId) {
        const title = content.length > 40 ? content.substring(0, 40) + "..." : content;
        const newId = await onTitleCreate(title);
        currentId = newId;
        setActiveId(newId);
        setConversationId(newId);
      }
      const reflectPrefix = reflectionMode
        ? "[MODE RÉFLEXION] Avant de répondre, pense étape par étape entre des balises <think>...</think>, puis donne ta réponse finale après.\n\n"
        : "";
      const body: Record<string, any> = { content: reflectPrefix + content, model, agentMode };
      if (sentImageBase64) {
        body.imageData = sentImageBase64;
        body.imageMimeType = sentImageMime;
      }

      const token = localStorage.getItem("grado_token");
      const res = await fetch(`/api/anthropic/conversations/${currentId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = "Une erreur est survenue. Réessaie.";
        try { const errData = await res.json(); if (errData?.error) msg = String(errData.error); } catch {}
        throw new Error(msg);
      }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let streamError = "";
      let truncated = false;
      let lastPreviewUpdate = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) fullText += data.content;
              if (data.error && !streamError) streamError = String(data.error);
              if (data.truncated) truncated = true;
            } catch {
              // ignore partial JSON
            }
          }
        }
        const now = Date.now();
        if (now - lastPreviewUpdate > 300) {
          lastPreviewUpdate = now;
          setStreamText(fullText);
        }
      }

      if (!fullText && streamError) {
        throw new Error(streamError);
      }

      // Une erreur est survenue après avoir déjà reçu du texte (ex: crédit IA épuisé
      // en plein milieu d'une continuation) : on le signale au lieu de laisser le
      // message se couper silencieusement.
      if (fullText && streamError) {
        fullText += `\n\n${streamError.startsWith("⚠️") ? streamError : `⚠️ ${streamError}`}`;
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
        // Persist HTML immediately so the preview never flickers to blank
        const completedHtml = extractHtml(fullText);
        if (completedHtml) {
          setLastCompletedHtml(completedHtml);
          setPreviewKey((k) => k + 1); // force iframe remount with fresh HTML
        }

        setLocalMessages((prev) => [...prev, newMsg]);

        const mediaTag = extractMediaTag(fullText);
        if (mediaTag && currentId) {
          await triggerMediaGeneration(currentId, mediaTag.type, mediaTag.prompt, mediaTag.title, mediaTag.genre, mediaTag.lyrics);
        }

        // Le serveur a épuisé son budget de continuations automatiques mais la réponse
        // est encore tronquée (ex: gros site généré) : on relance nous-mêmes une suite
        // en arrière-plan, sans que l'utilisateur ait besoin de cliquer sur "Run".
        if (truncated) {
          await continueTruncatedMessage(newMsgId, currentId!);
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
          content: `⚠️ ${error instanceof Error && error.message ? error.message : "Une erreur est survenue. Réessaie."}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setStreamText("");
      onRunEnd();
      queryClient.invalidateQueries({ queryKey: getListAnthropicMessagesQueryKey(currentId!) });
      queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
    }
  };

  // Relance automatiquement une suite de génération quand le serveur a signalé que la
  // réponse est encore tronquée après avoir épuisé son propre budget de continuations.
  // Contrairement au bouton "Run" (qui relance le prompt depuis le début), ceci ajoute
  // la suite directement à la fin du même message, sans intervention de l'utilisateur.
  const continueTruncatedMessage = async (msgId: number, currentId: number) => {
    try {
      const token = localStorage.getItem("grado_token");
      const res = await fetch(`/api/anthropic/conversations/${currentId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: "Continue exactement là où tu t'es arrêté, sans rien répéter de ce que tu as déjà écrit et sans réintroduction.",
        }),
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let addition = "";
      let lastPreviewUpdate = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) addition += data.content;
            } catch {
              // ignore partial JSON
            }
          }
        }
        const now = Date.now();
        if (now - lastPreviewUpdate > 300) {
          lastPreviewUpdate = now;
          setLocalMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, content: m.content + addition } : m))
          );
        }
      }

      if (addition) {
        setLocalMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, content: m.content + addition } : m))
        );
        const merged = localMessages.find((m) => m.id === msgId)?.content ?? "";
        const completedHtml = extractHtml(merged + addition);
        if (completedHtml) {
          setLastCompletedHtml(completedHtml);
          setPreviewKey((k) => k + 1);
        }
      }
    } catch (err) {
      console.error("continueTruncatedMessage error:", err);
    } finally {
      queryClient.invalidateQueries({ queryKey: getListAnthropicMessagesQueryKey(currentId) });
    }
  };

  const handleMultiAgent = async () => {
    const content = input.trim();
    if (!content || isRunning) return;

    setIsMultiAgent(false);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    let currentId = activeId;
    if (!currentId) {
      const title = content.length > 40 ? content.substring(0, 40) + "..." : content;
      const newId = await onTitleCreate(title);
      currentId = newId;
      setActiveId(newId);
      setConversationId(newId);
    }

    const userMsgId = Date.now();
    setLocalMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        conversationId: currentId!,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      } as AnthropicMessage,
    ]);

    setLiveAgentCode("");
    setMultiAgentPrompt(content);
    setIsMultiAgent(true);
    onRunStart();
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  // Écran divisé : HTML en cours de génération (live) → HTML de session → HTML des messages DB
  const liveStreamHtml = isRunning && streamText ? extractHtmlLoose(streamText) : null;
  const lastMessageHtml = (() => {
    for (let i = localMessages.length - 1; i >= 0; i--) {
      const m = localMessages[i];
      if (m.role === "assistant") {
        const h = extractHtml(m.content);
        if (h) return h;
      }
    }
    return null;
  })();
  // lastCompletedHtml évite le clignotement entre la fin du stream et la mise à jour de localMessages
  const previewHtml = liveStreamHtml ?? lastCompletedHtml ?? lastMessageHtml;

  const {
    publishedUrl,
    isPublishing,
    copied,
    showModal: showPublishModal,
    setShowModal: setShowPublishModal,
    title: publishTitle,
    setTitle: setPublishTitle,
    fullUrl: publishedFullUrl,
    handleDownload: handlePreviewDownload,
    handlePublishClick,
    handleConfirmPublish,
  } = usePublish(previewHtml ?? "");

  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const handleGithubImport = async (importedHtml: string, sourceLabel: string) => {
    let currentId = activeId;
    if (!currentId) {
      const title = `Import GitHub — ${sourceLabel}`;
      const newId = await onTitleCreate(title);
      currentId = newId;
      setActiveId(newId);
      setConversationId(newId);
    }
    const content = `Site importé depuis GitHub (\`${sourceLabel}\`) :\n\n\`\`\`html\n${importedHtml}\n\`\`\``;
    const newMsg: AnthropicMessage = {
      id: Date.now(),
      conversationId: currentId!,
      role: "assistant",
      content,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, newMsg]);
    setPreviewTab("apercu");
    try {
      const t = localStorage.getItem("grado_token");
      await fetch(`/api/anthropic/conversations/${currentId}/messages/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body: JSON.stringify({ content }),
      });
      queryClient.invalidateQueries({ queryKey: getListAnthropicMessagesQueryKey(currentId!) });
      queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
    } catch (err) {
      console.error("github import persist error:", err);
    }
  };

  const showWelcome = !activeId && localMessages.length === 0 && !isRunning;
  const activeAgent = AGENTS.find((a) => a.id === agentMode)!;

  return (
    <div className="flex h-full bg-[#000000]">
    <div className="flex flex-col h-full flex-1 min-w-0">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl w-full mx-auto flex flex-col gap-4">
          {showWelcome ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center gap-6">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#5B5BD6]/30 rounded-2xl blur-2xl scale-150" />
                <GradoLogo size={48} className="relative" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="w-full"
              >
                <WelcomeInner setInput={setInput} focusInput={() => textareaRef.current?.focus()} />
              </motion.div>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {localMessages.map((msg) => {
                  // Find the most recent user message before this one that has an image
                  const msgIndex = localMessages.indexOf(msg);
                  const precedingUserImgUrl = (() => {
                    if (msg.role !== "assistant") return undefined;
                    for (let i = msgIndex - 1; i >= 0; i--) {
                      const prev = localMessages[i];
                      if (prev.role === "user") {
                        return msgImageMap[prev.id] ?? undefined;
                      }
                    }
                    return undefined;
                  })();
                  const html = msg.role === "assistant"
                    ? extractHtml(msg.content, precedingUserImgUrl ? [precedingUserImgUrl] : undefined)
                    : null;
                  const mediaTag = msg.role === "assistant" ? extractMediaTag(msg.content) : null;
                  const rawDisplay = mediaTag ? stripMediaTag(msg.content) : msg.content;
                  // Extract <think>...</think> block for reflection mode display
                  const thinkMatch = msg.role === "assistant" ? rawDisplay.match(/<think>([\s\S]*?)<\/think>/i) : null;
                  const thinkContent = thinkMatch ? thinkMatch[1].trim() : null;
                  const contentWithoutThink = thinkContent ? rawDisplay.replace(/<think>[\s\S]*?<\/think>/i, "").trim() : rawDisplay;
                  // When HTML is present, only show text before the code block (hide the raw code)
                  const displayContent = html
                    ? contentWithoutThink.split(/```|<!DOCTYPE|<html[\s>]/i)[0].trim()
                    : contentWithoutThink;
                  const mediaJob = mediaTag ? mediaJobs.find((j) => j.prompt === mediaTag.prompt) : undefined;
                  const msgImagePreview = (msg as any).imagePreview as string | undefined;

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

                      <div className={cn("flex flex-col gap-2", msg.role === "assistant" ? "flex-1 min-w-0" : "max-w-[80%]")}>
                        {/* Image attachment preview */}
                        {msg.role === "user" && msgImagePreview && (
                          <div className="flex justify-end">
                            <img
                              src={msgImagePreview}
                              alt="Pièce jointe"
                              className="max-w-[200px] max-h-[160px] rounded-xl border border-[#2a2a38] object-cover"
                            />
                          </div>
                        )}

                        {/* Reflection block */}
                        {thinkContent && (
                          <div className="text-xs">
                            <button
                              onClick={() => setExpandedThinking(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                              className="flex items-center gap-1.5 text-amber-400/70 hover:text-amber-300 transition-colors mb-1"
                            >
                              {expandedThinking[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              <span>Réflexion de Grado</span>
                            </button>
                            <AnimatePresence>
                              {expandedThinking[msg.id] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2.5 text-[#B8A880] leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                                    {thinkContent}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Text bubble — hidden when message is pure HTML (preview replaces it) */}
                        {(!html || displayContent) && (!mediaTag || displayContent) && (
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 text-sm",
                              msg.role === "user"
                                ? "bg-[#5B5BD6] text-white rounded-br-sm"
                                : "bg-[#0A0A0A] border border-[#2a2a38] text-[#E8E8F0] rounded-bl-sm"
                            )}
                          >
                            {msg.role === "user" ? (
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            ) : html && !expandedHtmlText[msg.id] ? (
                              // Quand un site/app est généré, on garde le message d'accompagnement
                              // court (3-4 lignes) — la vraie sortie est dans l'aperçu à droite.
                              <>
                                <div className="line-clamp-4">
                                  <MarkdownRenderer content={displayContent} />
                                </div>
                                {displayContent.length > 220 && (
                                  <button
                                    onClick={() =>
                                      setExpandedHtmlText((prev) => ({ ...prev, [msg.id]: true }))
                                    }
                                    className="mt-1 text-xs text-[#8888A8] hover:text-white transition-colors"
                                  >
                                    Voir plus
                                  </button>
                                )}
                              </>
                            ) : (
                              <MarkdownRenderer content={displayContent} />
                            )}
                          </div>
                        )}

                        {/* Image player */}
                        {mediaJob && mediaJob.type === "image" && mediaJob.mediaId > 0 && (
                          <ImagePlayer
                            mediaId={mediaJob.mediaId}
                            prompt={mediaJob.prompt}
                          />
                        )}

                        {/* Music / video player */}
                        {mediaJob && mediaJob.type !== "image" && mediaJob.mediaId > 0 && (
                          <MediaPlayer
                            type={mediaJob.type as "music" | "video"}
                            mediaId={mediaJob.mediaId}
                            prompt={mediaJob.prompt}
                            title={mediaJob.title}
                            genre={mediaJob.genre}
                            lyrics={mediaJob.lyrics}
                          />
                        )}

                        {/* Free/plan media quota reached */}
                        {mediaJob && mediaJob.mediaId === -2 && (
                          <div className="mt-3 rounded-xl border border-[#5B5BD6]/25 bg-[#5B5BD6]/5 px-4 py-3 text-xs text-[#9B9BFF]">
                            {mediaJob.quotaError === "FREE_VIDEO_QUOTA_REACHED"
                              ? "🎬 La génération vidéo n'est pas disponible sur le plan gratuit."
                              : mediaJob.quotaError === "PLAN_VIDEO_QUOTA_REACHED"
                                ? "🎬 Tu n'as plus assez de créations ce mois-ci pour générer une vidéo (chaque vidéo coûte 8 créations)."
                                : mediaJob.quotaError === "PLAN_VIDEO_MONTHLY_CAP_REACHED"
                                  ? "🎬 Tu as atteint le nombre maximum de vidéos incluses ce mois-ci pour ton plan."
                                  : "🎵 Tu as utilisé tes 3 chansons gratuites ce mois-ci."}{" "}
                            Passe à un plan supérieur pour continuer.{" "}
                            <a href="/pricing" className="underline font-semibold text-[#7B7BFF]">Voir les tarifs →</a>
                          </div>
                        )}

                        {/* API key warning */}
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
                {isMultiAgent && (
                  <motion.div
                    key="multi-agent"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <AgentAvatar />
                    <AgentOrchestrator
                      prompt={multiAgentPrompt}
                      token={localStorage.getItem("grado_token")}
                      onPreview={(html) => {
                        // Add generated HTML as a real assistant message so it survives DB sync
                        setLocalMessages((prev) => [
                          ...prev,
                          {
                            id: Date.now(),
                            conversationId: activeId!,
                            role: "assistant",
                            content: "```html\n" + html + "\n```",
                            createdAt: new Date().toISOString(),
                          } as AnthropicMessage,
                        ]);
                      }}
                      onDone={() => {
                        onRunEnd();
                        // don't clear isMultiAgent here — keep preview visible
                      }}
                      onStream={(_agentId, text) => {
                        setLiveAgentCode(text);
                        setTimeout(() => {
                          if (liveCodeRef.current) liveCodeRef.current.scrollTop = liveCodeRef.current.scrollHeight;
                        }, 0);
                      }}
                    />
                  </motion.div>
                )}
                {isRunning && !isMultiAgent && (
                  <motion.div
                    key="shark"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <AgentAvatar />
                    <div
                      className="rounded-2xl rounded-bl-sm px-4 py-3 relative overflow-hidden"
                      style={{
                        background: "rgba(10,10,10,0.85)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(91,91,214,0.25)",
                        boxShadow: "0 0 16px rgba(91,91,214,0.08)",
                      }}
                    >
                      <SharkCoding isBuilding={isBuilding} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-[#2a2a38] bg-[#050505] px-4 pt-2 pb-3">
        <div className="max-w-2xl mx-auto">

          {/* Toolbar — simplified: 3 controls + ··· overflow */}
          <div className={cn("flex items-center gap-2 mb-2", rtl && "flex-row-reverse")}>

            {/* 1 — Agent mode selector */}
            <div className="relative">
              <button
                onClick={() => { setShowAgents(v => !v); setShowMore(false); }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                  showAgents
                    ? "bg-[#5B5BD6]/15 border-[#5B5BD6]/40 text-white"
                    : "bg-[#0A0A0A] border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/30"
                )}
              >
                <activeAgent.icon className="w-3 h-3" />
                {activeAgent.label}
              </button>
              <AnimatePresence>
                {showAgents && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className={cn(
                      "absolute bottom-full mb-2 bg-[#1a1a24] border border-[#2a2a38] rounded-xl p-1.5 z-50 min-w-[200px] shadow-xl",
                      rtl ? "right-0" : "left-0"
                    )}
                  >
                    {(["Création", "Connaissance"] as const).map((group) => {
                      const groupLabel = group === "Création" ? t.groupCreation : t.groupKnowledge;
                      return (
                        <div key={group}>
                          <div className="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-[#5B5BD6]/60 mt-1 first:mt-0">
                            {groupLabel}
                          </div>
                          {AGENTS.filter(a => a.group === group).map((ag) => {
                            const Icon = ag.icon;
                            return (
                              <button
                                key={ag.id}
                                onClick={() => { setAgentMode(ag.id); setShowAgents(false); }}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all",
                                  rtl ? "flex-row-reverse text-right" : "text-left",
                                  agentMode === ag.id
                                    ? "bg-[#5B5BD6]/15 text-white"
                                    : "text-[#8888A8] hover:text-white hover:bg-[#ffffff08]"
                                )}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <div>
                                  <div className="font-medium">{ag.label}</div>
                                  <div className="text-[10px] opacity-60">{ag.desc}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2 — Model selector */}
            {(() => {
              const MODELS: { id: ModelChoice; label: string; badge?: string; paid?: boolean }[] = [
                { id: "haiku",   label: "Haiku",   badge: "Claude" },
                { id: "sonnet",  label: "Sonnet",  badge: "Claude", paid: true },
                { id: "gemini",  label: "Flash",   badge: "Gemini", paid: true },
                { id: "mistral", label: "Mistral", badge: "Free",   paid: true },
                { id: "llama",   label: "Llama",   badge: "Free",   paid: true },
              ];
              const current = MODELS.find(m => m.id === model) ?? MODELS[0];
              return (
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#0A0A0A] border border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/30 transition-all">
                    <Zap className="w-3 h-3" />
                    <span className="text-white/80">{current.label}</span>
                    <span className="opacity-40 text-[10px]">{current.badge}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                  <div className="absolute bottom-full mb-1.5 left-0 hidden group-hover:flex flex-col bg-[#0D0D0F] border border-[#2a2a38] rounded-xl shadow-xl overflow-hidden z-50 min-w-[150px]">
                    {MODELS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => (m.paid && !isPaidUser) || (m.id === "sonnet" && !sonnetAllowed) ? navigate("/pricing") : setModel(m.id)}
                        className={cn(
                          "flex items-center justify-between gap-2 px-3 py-2 text-xs transition-all hover:bg-[#5B5BD6]/10",
                          model === m.id ? "text-white bg-[#5B5BD6]/15" : "text-[#8888A8]"
                        )}
                      >
                        <span>{m.label}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">{m.badge}</span>
                          {((m.paid && !isPaidUser) || (m.id === "sonnet" && !sonnetAllowed)) && <Lock className="w-2.5 h-2.5 opacity-50" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 3 — ··· More options (Réflexion + Partager) */}
            <div className="relative">
              <button
                onClick={() => { setShowMore(v => !v); setShowAgents(false); }}
                title={t.toolMore}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                  showMore || reflectionMode
                    ? "bg-[#5B5BD6]/15 border-[#5B5BD6]/40 text-white"
                    : "bg-[#0A0A0A] border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/30"
                )}
              >
                {reflectionMode && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                <ChevronUp className={cn("w-3 h-3 transition-transform", !showMore && "rotate-180")} />
              </button>
              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className={cn(
                      "absolute bottom-full mb-2 bg-[#1a1a24] border border-[#2a2a38] rounded-xl p-1.5 z-50 min-w-[160px] shadow-xl",
                      rtl ? "right-0" : "left-0"
                    )}
                  >
                    {/* Réflexion */}
                    <button
                      onClick={() => isPaidUser ? (setReflectionMode(v => !v), setShowMore(false)) : (setShowMore(false), navigate("/pricing"))}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all",
                        rtl ? "flex-row-reverse text-right" : "text-left",
                        reflectionMode && isPaidUser
                          ? "bg-amber-500/12 text-amber-300"
                          : "text-[#8888A8] hover:text-white hover:bg-[#ffffff08]"
                      )}
                    >
                      {isPaidUser ? <Brain className="w-3.5 h-3.5 shrink-0" /> : <Lock className="w-3.5 h-3.5 shrink-0" />}
                      <div>
                        <div className="font-medium">{t.toolReflection}</div>
                        <div className="text-[10px] opacity-60">
                          {!isPaidUser ? (rtl ? "يتطلب خطة مدفوعة" : "Plan payant requis")
                            : reflectionMode ? (rtl ? "مفعّل" : "Activé ✓") : (rtl ? "Grado يفكّر أولاً" : "Grado pense d'abord")}
                        </div>
                      </div>
                    </button>
                    {/* Partager */}
                    <div className={cn("px-1", rtl && "flex justify-end")}>
                      <ShareButton conversationId={activeId} token={token} label={t.toolShare} rtl={rtl} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4 — Multi-Agents (right-aligned) */}
            <button
              onClick={isPaidUser ? handleMultiAgent : () => navigate("/pricing")}
              disabled={isPaidUser && (!input.trim() || isRunning)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all",
                rtl ? "mr-auto" : "ml-auto",
                !isPaidUser
                  ? "bg-[#0A0A0A] border-[#5B5BD6]/30 text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/60"
                  : input.trim() && !isRunning
                    ? "bg-gradient-to-r from-[#8B5CF6]/20 to-[#5B5BD6]/20 border-[#7B5CF6]/50 text-white hover:from-[#8B5CF6]/30 hover:to-[#5B5BD6]/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                    : "bg-[#0A0A0A] border-[#2a2a38] text-[#8888A8]/50 cursor-not-allowed"
              )}
              title={isPaidUser ? t.toolMultiAgents : "Plan payant requis"}
            >
              {isPaidUser ? <Users className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isPaidUser ? `⚡ ${t.toolMultiAgents}` : t.toolMultiAgents}
            </button>
          </div>

          {/* Image preview */}
          <AnimatePresence>
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2"
              >
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Pièce jointe"
                    className="max-h-[120px] max-w-[180px] rounded-xl border border-[#2a2a38] object-cover"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-1.5 -right-1.5 bg-[#1a1a24] border border-[#2a2a38] rounded-full p-0.5 text-[#8888A8] hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main input row */}
          <div className="flex items-end gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 rounded-lg transition-colors",
                imagePreview
                  ? "text-[#5B5BD6] hover:text-[#7B7BFF]"
                  : "text-[#8888A8] hover:text-white"
              )}
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-attachment"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 rounded-lg transition-colors",
                isListening
                  ? "text-red-400 hover:text-red-300 bg-red-500/10"
                  : "text-[#8888A8] hover:text-white"
              )}
              onClick={() => isListening ? stopListening() : startListening()}
              title={isListening ? "Arrêter l'écoute" : "Parler à Grado"}
              data-testid="button-voice"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            <div className="flex-1 bg-[#0A0A0A] border border-[#2a2a38] rounded-xl focus-within:border-[#5B5BD6]/60 transition-colors">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Décris ce que tu veux créer..."
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
              onClick={() => handleSend()}
              data-testid="button-send"
            >
              <SendHorizonal className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-[#8888A8]/60 mt-2">
            Grado peut créer des apps, composer de la musique et générer des vidéos.
          </p>
        </div>
      </div>
    </div>

    {/* ── Aperçu en direct (redimensionnable) ── */}
    {previewHtml && (
      <>
        <div
          onMouseDown={handlePreviewResizeStart}
          title="Glisser pour redimensionner"
          className="hidden lg:flex items-center justify-center w-2 shrink-0 cursor-col-resize group relative z-10"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-[#1e1e2a] group-hover:bg-[#5B5BD6]/50 transition-colors" />
          <div className="relative z-10 flex items-center justify-center w-3.5 h-8 rounded-full bg-[#0e0e16] border border-[#2a2a38] group-hover:border-[#5B5BD6]/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-2.5 h-2.5 text-[#8888A8]" />
          </div>
        </div>
        <div
          className="hidden lg:flex flex-col shrink-0 border-l border-[#1e1e2a] bg-[#030306]"
          style={{ width: previewWidth }}
        >
        <div className="h-11 flex items-center gap-2 px-4 border-b border-[#1e1e2a] bg-[#050508] shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-semibold text-[#C8C8E8] ml-2">Aperçu en direct</span>
          <div className="flex items-center gap-1 ml-3 bg-[#0A0A0C] border border-[#1e1e2a] rounded-lg p-0.5">
            <button
              onClick={() => setPreviewTab("apercu")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all",
                previewTab === "apercu" ? "bg-[#5B5BD6] text-white" : "text-[#8888A8] hover:text-white"
              )}
            >
              Aperçu
            </button>
            <button
              onClick={() => setPreviewTab("code")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all",
                previewTab === "code" ? "bg-[#5B5BD6] text-white" : "text-[#8888A8] hover:text-white"
              )}
            >
              Code
            </button>
          </div>
          <div className="flex-1" />
          {previewHtml && previewTab === "apercu" && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                title="Actualiser l'aperçu"
                className="flex items-center gap-1 text-[10px] font-semibold text-[#8888A8] hover:text-white border border-[#1e1e2a] hover:border-[#5B5BD6]/40 rounded-md px-1.5 py-1 transition-colors"
                data-testid="button-refresh-preview"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setPreviewFullscreen(true)}
                title="Plein écran"
                className="flex items-center gap-1 text-[10px] font-semibold text-[#8888A8] hover:text-white border border-[#1e1e2a] hover:border-[#5B5BD6]/40 rounded-md px-1.5 py-1 transition-colors"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          )}
          {isRunning ? (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#7B7BFF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B5BD6] animate-pulse" />
              Construction en cours…
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Prêt
            </span>
          )}
        </div>

        {/* Address bar */}
        {previewHtml && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#1e1e2a] bg-[#050508] shrink-0 overflow-x-auto">
            <div className="flex-1 min-w-0 bg-[#0A0A0C] rounded-md px-3 py-1 text-[11px] text-[#8888A8] font-mono truncate border border-[#1e1e2a]">
              {publishedFullUrl ?? "grado://preview"}
            </div>
            {publishedFullUrl && (
              <a
                href={publishedUrl!}
                target="_blank"
                rel="noopener noreferrer"
                title="Ouvrir le site publié"
                className="flex items-center justify-center w-6 h-6 shrink-0 text-[#8888A8] hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <ShareButton conversationId={activeId} token={token} label="Partager" rtl={rtl} compact align="bottom" />
            <GithubMenu token={token} html={previewHtml} conversationId={activeId} onImport={handleGithubImport} compact align="bottom" />
            <button
              onClick={handlePreviewDownload}
              title="Télécharger le HTML"
              className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[#8888A8] hover:text-white border border-[#1e1e2a] hover:border-[#5B5BD6]/40 rounded-md px-2 py-1 transition-colors shrink-0 whitespace-nowrap"
              data-testid="button-download-preview"
            >
              <Download className="w-3 h-3" /> <span className="hidden xl:inline">Télécharger</span>
            </button>
            <button
              onClick={handlePublishClick}
              disabled={isPublishing}
              title={publishedUrl ? "Copier le lien" : "Publier ce site"}
              className={cn(
                "flex items-center justify-center gap-1 text-[10px] font-semibold rounded-md px-2.5 py-1 transition-all shrink-0 whitespace-nowrap",
                publishedUrl
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white shadow-[0_0_10px_rgba(91,91,214,0.4)]"
              )}
              data-testid="button-publish-preview"
            >
              {copied ? (
                <><CheckCheck className="w-3 h-3" /> Copié !</>
              ) : publishedUrl ? (
                <><Globe className="w-3 h-3" /> Copier le lien</>
              ) : (
                <><Rocket className="w-3 h-3" /> Publier</>
              )}
            </button>
          </div>
        )}

        <div className="flex-1 p-3 min-h-0">
          {previewTab === "code" ? (
            isMultiAgent && isRunning && liveAgentCode ? (
              <pre ref={liveCodeRef} className="w-full h-full rounded-xl border border-[#1e1e2a] bg-[#0A0A0C] text-[#9ecbff] text-[11px] leading-relaxed p-4 overflow-auto font-mono whitespace-pre-wrap">
                {liveAgentCode}
              </pre>
            ) : isRunning && streamText ? (
              <pre ref={liveCodeRef} className="w-full h-full rounded-xl border border-[#1e1e2a] bg-[#0A0A0C] text-[#9ecbff] text-[11px] leading-relaxed p-4 overflow-auto font-mono whitespace-pre-wrap">
                {streamText}
              </pre>
            ) : previewHtml ? (
              <pre className="w-full h-full rounded-xl border border-[#1e1e2a] bg-[#0A0A0C] text-[#9ecbff] text-[11px] leading-relaxed p-4 overflow-auto font-mono whitespace-pre-wrap">
                {previewHtml}
              </pre>
            ) : (
              <PreviewLoadingScreen />
            )
          ) : isRunning ? (
            <PreviewLoadingScreen />
          ) : previewHtml ? (
            <iframe
              key={`${activeId ?? 0}-${previewKey}`}
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              className="w-full h-full rounded-xl border border-[#1e1e2a] bg-white shadow-[0_0_40px_rgba(91,91,214,0.08)]"
              title="Aperçu en direct"
            />
          ) : (
            <PreviewLoadingScreen />
          )}
        </div>
      </div>
      </>
    )}
    {showPublishModal && (
      <PublishModal
        title={publishTitle}
        setTitle={setPublishTitle}
        isPublishing={isPublishing}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handleConfirmPublish}
      />
    )}

    {/* ── Bouton flottant Aperçu (mobile uniquement) ── */}
    {previewHtml && !mobilePreviewOpen && (
      <button
        onClick={() => setMobilePreviewOpen(true)}
        className={cn(
          "lg:hidden fixed bottom-24 right-4 z-40 flex items-center gap-2 pl-3 pr-4 py-3 rounded-full shadow-[0_4px_24px_rgba(91,91,214,0.5)] text-white text-xs font-semibold transition-transform active:scale-95",
          isRunning ? "bg-gradient-to-r from-[#5B5BD6] to-[#8B5CF6]" : "bg-[#5B5BD6]"
        )}
        data-testid="button-open-mobile-preview"
      >
        <span className="relative flex items-center justify-center w-5 h-5">
          {isRunning && <span className="absolute inline-flex h-full w-full rounded-full bg-white/40 animate-ping" />}
          <span className="relative text-base">🤖</span>
        </span>
        {isRunning ? "Construction…" : "Voir l'aperçu"}
      </button>
    )}

    {/* ── Aperçu en direct plein écran (mobile) ── */}
    <AnimatePresence>
      {mobilePreviewOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden fixed inset-0 z-50 flex flex-col bg-[#030306]"
        >
          <div className="h-12 flex items-center gap-2 px-3 border-b border-[#1e1e2a] bg-[#050508] shrink-0">
            <button
              onClick={() => setMobilePreviewOpen(false)}
              className="flex items-center gap-1 text-xs font-semibold text-[#8888A8] hover:text-white px-2 py-1.5 rounded-lg transition-colors"
              data-testid="button-close-mobile-preview"
            >
              <X className="w-4 h-4" /> Fermer
            </button>
            <span className="text-xs font-semibold text-[#C8C8E8] ml-1">Aperçu en direct</span>
            <div className="flex items-center gap-1 ml-2 bg-[#0A0A0C] border border-[#1e1e2a] rounded-lg p-0.5">
              <button
                onClick={() => setPreviewTab("apercu")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all",
                  previewTab === "apercu" ? "bg-[#5B5BD6] text-white" : "text-[#8888A8] hover:text-white"
                )}
              >
                Aperçu
              </button>
              <button
                onClick={() => setPreviewTab("code")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all",
                  previewTab === "code" ? "bg-[#5B5BD6] text-white" : "text-[#8888A8] hover:text-white"
                )}
              >
                Code
              </button>
            </div>
            <div className="flex-1" />
            {isRunning ? (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#7B7BFF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B5BD6] animate-pulse" />
                En cours…
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Prêt
              </span>
            )}
          </div>

          {previewHtml && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#1e1e2a] bg-[#050508] shrink-0 overflow-x-auto">
              <div className="flex-1 min-w-0 bg-[#0A0A0C] rounded-md px-3 py-1 text-[11px] text-[#8888A8] font-mono truncate border border-[#1e1e2a]">
                {publishedFullUrl ?? "grado://preview"}
              </div>
              {publishedFullUrl && (
                <a
                  href={publishedUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-6 h-6 shrink-0 text-[#8888A8] hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <ShareButton conversationId={activeId} token={token} label="Partager" rtl={rtl} compact align="bottom" />
              <GithubMenu token={token} html={previewHtml} conversationId={activeId} onImport={handleGithubImport} compact align="bottom" />
              <button
                onClick={handlePreviewDownload}
                className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[#8888A8] hover:text-white border border-[#1e1e2a] hover:border-[#5B5BD6]/40 rounded-md px-2 py-1 transition-colors shrink-0 whitespace-nowrap"
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={handlePublishClick}
                disabled={isPublishing}
                className={cn(
                  "flex items-center justify-center gap-1 text-[10px] font-semibold rounded-md px-2.5 py-1 transition-all shrink-0 whitespace-nowrap",
                  publishedUrl
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white shadow-[0_0_10px_rgba(91,91,214,0.4)]"
                )}
              >
                {copied ? (
                  <><CheckCheck className="w-3 h-3" /> Copié !</>
                ) : publishedUrl ? (
                  <><Globe className="w-3 h-3" /> Copier</>
                ) : (
                  <><Rocket className="w-3 h-3" /> Publier</>
                )}
              </button>
            </div>
          )}

          <div className="flex-1 p-2.5 min-h-0">
            {previewTab === "code" ? (
              isMultiAgent && isRunning && liveAgentCode ? (
                <pre className="w-full h-full rounded-xl border border-[#1e1e2a] bg-[#0A0A0C] text-[#9ecbff] text-[11px] leading-relaxed p-4 overflow-auto font-mono whitespace-pre-wrap">
                  {liveAgentCode}
                </pre>
              ) : isRunning && streamText ? (
                <pre className="w-full h-full rounded-xl border border-[#1e1e2a] bg-[#0A0A0C] text-[#9ecbff] text-[11px] leading-relaxed p-4 overflow-auto font-mono whitespace-pre-wrap">
                  {streamText}
                </pre>
              ) : previewHtml ? (
                <pre className="w-full h-full rounded-xl border border-[#1e1e2a] bg-[#0A0A0C] text-[#9ecbff] text-[11px] leading-relaxed p-4 overflow-auto font-mono whitespace-pre-wrap">
                  {previewHtml}
                </pre>
              ) : (
                <PreviewLoadingScreen />
              )
            ) : isRunning ? (
              <PreviewLoadingScreen />
            ) : previewHtml ? (
              <iframe
                key={`mob-${activeId ?? 0}-${previewKey}`}
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                className="w-full h-full rounded-xl border border-[#1e1e2a] bg-white shadow-[0_0_40px_rgba(91,91,214,0.08)]"
                title="Aperçu en direct mobile"
              />
            ) : (
              <PreviewLoadingScreen />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ── Aperçu plein écran ── */}
    <AnimatePresence>
      {previewFullscreen && previewHtml && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
        >
          {/* Header */}
          <div className="h-11 flex items-center gap-2 px-4 bg-[#050508] border-b border-[#1e1e2a] shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <span className="text-xs font-semibold text-[#C8C8E8] ml-2">Aperçu plein écran</span>
            <div className="flex-1" />
            <button
              onClick={() => setPreviewFullscreen(false)}
              title="Quitter le plein écran"
              className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8888A8] hover:text-white border border-[#1e1e2a] hover:border-[#5B5BD6]/40 rounded-md px-2 py-1 transition-colors"
            >
              <Minimize2 className="w-3 h-3" />
              <span>Fermer</span>
            </button>
          </div>
          {/* Full iframe */}
          <iframe
            key={`fs-${activeId ?? 0}-${previewKey}`}
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-forms allow-modals allow-popups"
            className="flex-1 w-full border-0 bg-white"
            title="Aperçu plein écran"
          />
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
