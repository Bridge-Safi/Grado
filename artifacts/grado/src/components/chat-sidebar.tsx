import React from "react";
import { Plus, Trash2, MessageSquare, PanelLeftClose, Settings, Shield } from "lucide-react";
import { AnthropicConversation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GradoLogo } from "@/components/grado-logo";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  conversations: AnthropicConversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
}

export function Sidebar({
  isOpen,
  setIsOpen,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: SidebarProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!isOpen) return null;

  return (
    <aside className="w-64 border-r border-[#1e1e2a] bg-[#0e0e16] flex-shrink-0 flex flex-col h-full z-20 absolute md:relative transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#1e1e2a]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 bg-[#5B5BD6]/25 rounded-lg blur-md" />
            <GradoLogo size={26} className="relative" />
          </div>
          <span className="font-bold text-white tracking-tight">Grado</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#8888A8] hover:text-white hover:bg-[#1a1a28]"
          onClick={() => setIsOpen(false)}
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      </div>

      {/* New chat */}
      <div className="px-3 py-3">
        <Button
          className="w-full justify-start gap-2 bg-[#5B5BD6]/10 hover:bg-[#5B5BD6]/20 text-[#7B7BFF] border border-[#5B5BD6]/25 hover:border-[#5B5BD6]/50 hover:shadow-[0_0_12px_rgba(91,91,214,0.15)] transition-all"
          onClick={onNew}
        >
          <Plus className="w-4 h-4" />
          Nouveau chat
        </Button>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1 px-3 py-1">
        {conversations.length === 0 ? (
          <div className="text-xs text-[#8888A8] p-3 text-center mt-4 bg-[#1a1a28] rounded-xl border border-[#2a2a38]">
            Aucun chat. Commence !
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-3 py-2 text-sm cursor-pointer transition-all",
                  activeId === conv.id
                    ? "bg-[#5B5BD6]/15 text-white border border-[#5B5BD6]/30 shadow-[0_0_8px_rgba(91,91,214,0.1)]"
                    : "text-[#8888A8] hover:bg-[#1a1a28] hover:text-white border border-transparent"
                )}
                onClick={() => onSelect(conv.id)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className={cn("w-3.5 h-3.5 flex-shrink-0", activeId === conv.id ? "text-[#7B7BFF]" : "")} />
                  <span className="truncate text-xs">{conv.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-[#8888A8] hover:text-red-400 shrink-0"
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Bottom links */}
      <div className="px-3 pb-3 space-y-1">
        <div className="h-px bg-gradient-to-r from-transparent via-[#5B5BD6]/30 to-transparent mb-2" />
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#8888A8] hover:text-white hover:bg-[#1a1a28] transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Paramètres</span>
        </button>
        <button
          onClick={() => navigate("/admin")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#8888A8] hover:text-white hover:bg-[#1a1a28] transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admin — Clients</span>
        </button>
        {user && (
          <div className="px-3 py-2 text-xs text-[#5555A8] truncate">{user.email}</div>
        )}
      </div>
    </aside>
  );
}
