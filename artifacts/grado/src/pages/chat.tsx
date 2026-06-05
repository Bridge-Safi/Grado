import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { 
  useListAnthropicConversations, 
  useCreateAnthropicConversation,
  useDeleteAnthropicConversation,
  useListAnthropicMessages,
  getListAnthropicConversationsQueryKey,
  getListAnthropicMessagesQueryKey,
  AnthropicConversation
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/chat-sidebar";
import { ChatArea } from "@/components/chat-area";
import logoUrl from "@assets/D589D749-E25A-4876-ACE2-D9DFD1C31E5C_1780620985737.png";

export default function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading: isLoadingConversations } = useListAnthropicConversations();
  const createConv = useCreateAnthropicConversation();
  const deleteConv = useDeleteAnthropicConversation();

  const { data: messages = [], isLoading: isLoadingMessages } = useListAnthropicMessages(
    activeConversationId || 0,
    { query: { enabled: !!activeConversationId, queryKey: getListAnthropicMessagesQueryKey(activeConversationId || 0) } }
  );

  const handleDeleteConversation = async (id: number) => {
    await deleteConv.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  const handleCreateConversation = async (title: string) => {
    const conv = await createConv.mutateAsync({ data: { title } });
    queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
    setActiveConversationId(conv.id);
    return conv.id;
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onDelete={handleDeleteConversation}
        onNew={() => setActiveConversationId(null)}
        logoUrl={logoUrl}
      />
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <ChatArea
          conversationId={activeConversationId}
          setConversationId={setActiveConversationId}
          messages={messages}
          onTitleCreate={handleCreateConversation}
          logoUrl={logoUrl}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </main>
    </div>
  );
}
