import { useState } from "react";
import { FolderPlus, Folder, Trash2, ChevronRight, X, Check, MessageSquare, FolderMinus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnthropicConversation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListAnthropicConversationsQueryKey } from "@workspace/api-client-react";

export interface Project {
  id: number;
  name: string;
  emoji: string;
}

interface ProjectsPanelProps {
  token: string | null;
  projects: Project[];
  conversations: AnthropicConversation[];
  activeConvId: number | null;
  onSelectConv: (id: number) => void;
  onProjectsChange: () => void;
}

const EMOJIS = ["📁", "🚀", "🎨", "💼", "🎵", "🎬", "📱", "🌐", "🔥", "⚡", "🛒", "📊"];

export function ProjectsPanel({
  token,
  projects,
  conversations,
  activeConvId,
  onSelectConv,
  onProjectsChange,
}: ProjectsPanelProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const queryClient = useQueryClient();

  const refreshConvs = () =>
    queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });

  const createProject = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
      body: JSON.stringify({ name: newName.trim(), emoji: newEmoji }),
    });
    if (res.ok) {
      onProjectsChange();
      setCreating(false);
      setNewName("");
      setNewEmoji("📁");
    }
  };

  const deleteProject = async (id: number) => {
    await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token ?? ""}` },
    });
    onProjectsChange();
    refreshConvs();
  };

  const removeFromProject = async (projectId: number, convId: number) => {
    await fetch(`/api/projects/${projectId}/conversations/${convId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token ?? ""}` },
    });
    refreshConvs();
  };

  return (
    <div className="px-3 pb-1">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] font-semibold text-[#5555A8] uppercase tracking-wider">Projets</span>
        <button
          onClick={() => setCreating(true)}
          className="text-[#8888A8] hover:text-[#5B5BD6] transition-colors"
          title="Nouveau projet"
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-2"
          >
            <div className="bg-[#1a1a28] border border-[#2a2a38] rounded-xl p-2.5 space-y-2">
              <div className="flex flex-wrap gap-1">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    className={cn(
                      "w-6 h-6 text-sm rounded flex items-center justify-center transition-all",
                      newEmoji === e ? "bg-[#5B5BD6]/30 ring-1 ring-[#5B5BD6]/50" : "hover:bg-[#2a2a38]"
                    )}
                  >{e}</button>
                ))}
              </div>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") createProject(); if (e.key === "Escape") setCreating(false); }}
                placeholder="Nom du projet"
                className="w-full bg-[#000000] border border-[#2a2a38] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#4a4a5a] focus:outline-none focus:border-[#5B5BD6]/60"
              />
              <div className="flex gap-1.5 justify-end">
                <button onClick={() => setCreating(false)} className="px-2 py-1 rounded text-xs text-[#8888A8] hover:text-white">
                  <X className="w-3 h-3" />
                </button>
                <button onClick={createProject} className="px-2 py-1 rounded bg-[#5B5BD6] text-white text-xs">
                  <Check className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-0.5">
        {projects.map(proj => {
          const projConvs = conversations.filter(c => c.projectId === proj.id);
          return (
            <div key={proj.id}>
              <div
                className="group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[#1a1a28] transition-colors"
                onClick={() => setExpanded(expanded === proj.id ? null : proj.id)}
              >
                <span className="text-sm">{proj.emoji}</span>
                <span className="flex-1 text-xs text-[#8888A8] group-hover:text-white truncate">{proj.name}</span>
                {projConvs.length > 0 && (
                  <span className="text-[9px] bg-[#5B5BD6]/20 text-[#7B7BFF] rounded-full px-1.5 py-0.5 font-semibold">
                    {projConvs.length}
                  </span>
                )}
                <ChevronRight className={cn("w-3 h-3 text-[#5555A8] transition-transform shrink-0", expanded === proj.id && "rotate-90")} />
                <button
                  onClick={e => { e.stopPropagation(); deleteProject(proj.id); }}
                  className="opacity-0 group-hover:opacity-100 text-[#8888A8] hover:text-red-400 transition-all shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <AnimatePresence>
                {expanded === proj.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pl-4"
                  >
                    {projConvs.length === 0 ? (
                      <div className="text-[10px] text-[#5555A8] px-2 py-1.5 italic">
                        Glisse des chats ici via 📂
                      </div>
                    ) : (
                      <div className="space-y-0.5 py-0.5">
                        {projConvs.map(conv => (
                          <div
                            key={conv.id}
                            className={cn(
                              "group/conv flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs",
                              activeConvId === conv.id
                                ? "bg-[#5B5BD6]/15 text-white border border-[#5B5BD6]/20"
                                : "text-[#8888A8] hover:bg-[#1a1a28] hover:text-white"
                            )}
                            onClick={() => onSelectConv(conv.id)}
                          >
                            <MessageSquare className="w-3 h-3 shrink-0" />
                            <span className="truncate flex-1">{conv.title}</span>
                            <button
                              onClick={e => { e.stopPropagation(); removeFromProject(proj.id, conv.id); }}
                              className="opacity-0 group-hover/conv:opacity-100 text-[#8888A8] hover:text-orange-400 transition-all shrink-0"
                              title="Retirer du projet"
                            >
                              <FolderMinus className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
