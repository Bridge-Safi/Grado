import { useState, useEffect } from "react";
import {
  useListAnthropicConversations,
  useCreateAnthropicConversation,
  useDeleteAnthropicConversation,
  useListAnthropicMessages,
  getListAnthropicConversationsQueryKey,
  getListAnthropicMessagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/chat-sidebar";
import { ChatArea } from "@/components/chat-area";
import { Play, PanelLeftOpen, Zap, LogOut } from "lucide-react";
import { UsageWidget } from "@/components/usage-widget";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { GradoLogo } from "@/components/grado-logo";
import { LangSwitcher } from "@/components/lang-switcher";

const ACTIVE_CONV_KEY = "grado_active_conversation";
const SIDEBAR_OPEN_KEY = "grado_sidebar_open";

function getStoredConversationId(): number | null {
  const raw = localStorage.getItem(ACTIVE_CONV_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) ? id : null;
}

function getStoredSidebarOpen(): boolean {
  const raw = localStorage.getItem(SIDEBAR_OPEN_KEY);
  return raw === null ? true : raw === "1";
}

export default function ChatPage() {
  const [activeConversationId, setActiveConversationIdState] = useState<number | null>(getStoredConversationId);
  const [isSidebarOpen, setIsSidebarOpenState] = useState(getStoredSidebarOpen);
  const [isRunning, setIsRunning] = useState(false);
  const [runCount, setRunCount] = useState(0);

  // Garde la page (conversation active + état de la sidebar) même après un
  // rechargement ou un retour sur /chat, pour que l'utilisateur retrouve
  // exactement là où il était.
  const setActiveConversationId = (id: number | null) => {
    setActiveConversationIdState(id);
    if (id === null) localStorage.removeItem(ACTIVE_CONV_KEY);
    else localStorage.setItem(ACTIVE_CONV_KEY, String(id));
  };

  const setIsSidebarOpen = (open: boolean | ((prev: boolean) => boolean)) => {
    setIsSidebarOpenState((prev) => {
      const next = typeof open === "function" ? open(prev) : open;
      localStorage.setItem(SIDEBAR_OPEN_KEY, next ? "1" : "0");
      return next;
    });
  };

  // Safety: if isRunning stays true for more than 60s, force-reset it
  useEffect(() => {
    if (!isRunning) return;
    const timer = setTimeout(() => setIsRunning(false), 60_000);
    return () => clearTimeout(timer);
  }, [isRunning]);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { user, logout, token } = useAuth();

  const { data: conversations = [] } = useListAnthropicConversations();
  const createConv = useCreateAnthropicConversation();
  const deleteConv = useDeleteAnthropicConversation();

  // Si la conversation mémorisée a été supprimée entre-temps, on revient
  // proprement à "Nouvelle conversation" au lieu de rester bloqué.
  useEffect(() => {
    if (activeConversationId === null) return;
    const stillExists = conversations.some((c: any) => c.id === activeConversationId);
    if (!stillExists) setActiveConversationId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  const { data: messages = [] } = useListAnthropicMessages(
    activeConversationId || 0,
    {
      query: {
        enabled: !!activeConversationId,
        queryKey: getListAnthropicMessagesQueryKey(activeConversationId || 0),
      },
    }
  );

  const handleDeleteConversation = async (id: number) => {
    await deleteConv.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
    if (activeConversationId === id) setActiveConversationId(null);
  };

  const handleCreateConversation = async (title: string) => {
    const conv = await createConv.mutateAsync({ data: { title } });
    queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
    setActiveConversationId(conv.id);
    return conv.id;
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[#000000]">
      {/* ── Top navbar with red Run button ── */}
      <header className="h-12 border-b border-[#2a2a38] bg-[#050505] flex items-center px-3 gap-3 shrink-0 z-20">
        {/* Sidebar toggle */}
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#8888A8] hover:text-white rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
            data-testid="button-toggle-sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </Button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2">
          <GradoLogo size={26} />
          <span className="text-sm font-semibold text-white tracking-tight">Grado</span>
        </div>

        <div className="flex-1" />

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-white font-medium leading-none">{user.name}</span>
              <span className="text-[10px] text-[#5B5BD6] leading-none mt-0.5 capitalize">{user.plan}</span>
            </div>
            <UsageWidget token={token} />
            <button
              onClick={() => {
                localStorage.removeItem(ACTIVE_CONV_KEY);
                logout();
                navigate("/");
              }}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#8888A8] hover:text-white hover:bg-[#1e1e2a] transition-all"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <LangSwitcher compact />

        {/* Red Run button */}
        <button
          data-testid="button-run-header"
          onClick={() => !isRunning && setRunCount(c => c + 1)}
          className={cn(
            "flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium transition-all duration-150 select-none",
            isRunning
              ? "bg-red-600/80 text-white animate-pulse cursor-not-allowed"
              : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)] hover:shadow-[0_0_18px_rgba(220,38,38,0.6)]"
          )}
          disabled={isRunning}
        >
          <Play className={cn("w-3.5 h-3.5", isRunning && "animate-spin")} fill="currentColor" />
          <span>{isRunning ? "Running..." : "Run"}</span>
        </button>
      </header>

      {/* ── Body: sidebar + chat ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onDelete={handleDeleteConversation}
          onNew={() => setActiveConversationId(null)}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
          <ChatArea
            conversationId={activeConversationId}
            setConversationId={setActiveConversationId}
            messages={messages}
            onTitleCreate={handleCreateConversation}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            onRunStart={() => setIsRunning(true)}
            onRunEnd={() => setIsRunning(false)}
            isRunning={isRunning}
            runTrigger={runCount}
          />
        </main>
      </div>
    </div>
  );
}
