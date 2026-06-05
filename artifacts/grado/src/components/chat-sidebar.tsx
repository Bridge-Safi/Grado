import React from "react";
import { Plus, Trash2, MessageSquare, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AnthropicConversation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  conversations: AnthropicConversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
  logoUrl: string;
}

export function Sidebar({
  isOpen,
  setIsOpen,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
  logoUrl
}: SidebarProps) {
  if (!isOpen) {
    return null; // The toggle button is in the ChatArea when closed
  }

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex-shrink-0 flex flex-col h-full z-20 absolute md:relative transition-all duration-300">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="Grado" className="w-6 h-6 object-contain" />
          <span className="font-semibold text-foreground tracking-wide">Grado</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-3 pb-2">
        <Button 
          variant="secondary" 
          className="w-full justify-start gap-2 bg-card hover:bg-muted text-foreground border border-border"
          onClick={onNew}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        {conversations.length === 0 ? (
          <div className="text-sm text-muted-foreground p-2 text-center mt-4">
            No chats yet. Start a new one.
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                  activeId === conv.id 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
                onClick={() => onSelect(conv.id)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
