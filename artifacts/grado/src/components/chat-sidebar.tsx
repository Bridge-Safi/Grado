import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, MessageSquare, PanelLeftClose, Settings, Shield, Globe, Download, FolderInput, Check } from "lucide-react";
import { AnthropicConversation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GradoLogo } from "@/components/grado-logo";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { ProjectsPanel, Project } from "./projects-panel";
import { useQueryClient } from "@tanstack/react-query";
import { getListAnthropicConversationsQueryKey } from "@workspace/api-client-react";

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
  const { t } = useI18n();
  const { canInstall, install } = usePwaInstall();
  const queryClient = useQueryClient();

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const token = localStorage.getItem("grado_token");

  // Assign-to-project dropdown
  const [assigningConvId, setAssigningConvId] = useState<number | null>(null);
  const assignRef = useRef<HTMLDivElement>(null);

  const loadProjects = async () => {
    if (!token) return;
    const res = await fetch("/api/projects", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setProjects(await res.json());
  };

  useEffect(() => { loadProjects(); }, [token]);

  // Close assign dropdown on outside click
  useEffect(() => {
    if (!assigningConvId) return;
    const handler = (e: MouseEvent) => {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) {
        setAssigningConvId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [assigningConvId]);

  const assignToProject = async (projectId: number, convId: number) => {
    if (!token) return;
    await fetch(`/api/projects/${projectId}/conversations/${convId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
    setAssigningConvId(null);
  };

  // Unassigned conversations (not in any project)
  const unassigned = conversations.filter(
    c => !c.projectId || !projects.some(p => p.id === c.projectId)
  );

  if (!isOpen) return null;

  return (
    <aside className="w-64 border-r border-[#1e1e2a] bg-[#0e0e16] flex-shrink-0 flex flex-col h-full z-20 absolute md:relative transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#1e1e2a]">
        <div className="flex items-center gap-2.5">
          <GradoLogo size={26} />
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
          {t.newChat}
        </Button>
      </div>

      {/* Projects */}
      <div className="border-b border-[#1e1e2a] py-2">
        <ProjectsPanel
          token={token}
          projects={projects}
          conversations={conversations}
          activeConvId={activeId}
          onSelectConv={onSelect}
          onProjectsChange={loadProjects}
        />
      </div>

      {/* Conversations (unassigned) */}
      <ScrollArea className="flex-1 px-3 py-1">
        {unassigned.length === 0 && conversations.length === 0 ? (
          <div className="text-xs text-[#8888A8] p-3 text-center mt-4 bg-[#1a1a28] rounded-xl border border-[#2a2a38]">
            {t.noConv}
          </div>
        ) : unassigned.length === 0 ? null : (
          <div className="space-y-1">
            {unassigned.map((conv) => (
              <div key={conv.id} className="relative">
                <div
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
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Assign to project */}
                    {projects.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssigningConvId(assigningConvId === conv.id ? null : conv.id);
                        }}
                        className="h-5 w-5 flex items-center justify-center rounded text-[#8888A8] hover:text-[#7B7BFF] hover:bg-[#5B5BD6]/10 transition-colors"
                        title="Ajouter à un projet"
                      >
                        <FolderInput className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      className="h-5 w-5 flex items-center justify-center rounded text-[#8888A8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Project picker dropdown */}
                {assigningConvId === conv.id && (
                  <div
                    ref={assignRef}
                    className="absolute left-0 right-0 top-full z-50 mt-1 bg-[#1a1a28] border border-[#2a2a38] rounded-xl shadow-xl overflow-hidden"
                  >
                    <p className="text-[10px] text-[#5555A8] px-3 pt-2 pb-1 uppercase tracking-wider font-semibold">
                      Déplacer vers
                    </p>
                    {projects.map(proj => (
                      <button
                        key={proj.id}
                        onClick={() => assignToProject(proj.id, conv.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#8888A8] hover:bg-[#5B5BD6]/10 hover:text-white transition-colors"
                      >
                        <span>{proj.emoji}</span>
                        <span className="flex-1 text-left truncate">{proj.name}</span>
                        <Check className="w-3 h-3 opacity-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Bottom links */}
      <div className="px-3 pb-3 space-y-1">
        <div className="h-px bg-gradient-to-r from-transparent via-[#5B5BD6]/30 to-transparent mb-2" />
        <button
          onClick={() => navigate("/sites")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#8888A8] hover:text-white hover:bg-[#1a1a28] transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Mes Sites</span>
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#8888A8] hover:text-white hover:bg-[#1a1a28] transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{t.settings}</span>
        </button>
        {user?.isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#8888A8] hover:text-white hover:bg-[#1a1a28] transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t.admin}</span>
          </button>
        )}
        {canInstall && (
          <button
            onClick={install}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#5B5BD6] hover:text-white hover:bg-[#1a1a28] transition-colors border border-[#5B5BD6]/20 hover:border-[#5B5BD6]/50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installer l'app</span>
          </button>
        )}
        {user && (
          <div className="px-3 py-2 text-xs text-[#5555A8] truncate">{user.email}</div>
        )}
      </div>
    </aside>
  );
}
