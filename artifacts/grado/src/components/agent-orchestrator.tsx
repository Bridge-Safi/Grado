import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ExternalLink, Download, Loader2, CheckCircle2, Circle, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentState {
  id: string;
  name: string;
  icon: string;
  color: string;
  task: string;
  status: "pending" | "running" | "done";
  output: string;
  index: number;
}

interface AgentOrchestratorProps {
  prompt: string;
  token: string | null;
  onPreview?: (html: string) => void;
  onDone?: () => void;
}

export function AgentOrchestrator({ prompt, token, onPreview, onDone }: AgentOrchestratorProps) {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const outputRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const abortRef = useRef<AbortController | null>(null);
  const firstEventRef = useRef(false);

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
  }, []);

  const run = async () => {
    abortRef.current = new AbortController();
    firstEventRef.current = false;

    // 30s timeout if no first event arrives — shows error
    const timeoutId = setTimeout(() => {
      if (!firstEventRef.current) {
        setError("Les agents ne répondent pas. Réessaie dans quelques secondes.");
        setConnecting(false);
        onDone?.();
        abortRef.current?.abort();
      }
    }, 30_000);

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        clearTimeout(timeoutId);
        const errText = await res.text().catch(() => "");
        setError(`Erreur ${res.status} — ${errText || "connexion impossible"}`);
        setConnecting(false);
        onDone?.();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            // First event received — clear timeout, mark connected
            if (!firstEventRef.current) {
              firstEventRef.current = true;
              clearTimeout(timeoutId);
              setConnecting(false);
            }
            handleEvent(ev);
          } catch { /* skip malformed */ }
        }
      }
      clearTimeout(timeoutId);
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name !== "AbortError") {
        setError(e.message || "Erreur inconnue");
        setConnecting(false);
        onDone?.();
      }
    }
  };

  const handleEvent = (ev: any) => {
    switch (ev.type) {
      case "agent_start":
        setAgents(prev => {
          const exists = prev.find(a => a.id === ev.agentId);
          if (exists) return prev.map(a => a.id === ev.agentId ? { ...a, status: "running" } : a);
          return [...prev, {
            id: ev.agentId,
            name: ev.name,
            icon: ev.icon,
            color: ev.color,
            task: ev.task,
            status: "running",
            output: "",
            index: ev.index,
          }];
        });
        setExpandedAgent(ev.agentId);
        break;

      case "agent_token":
        setAgents(prev => prev.map(a => {
          if (a.id !== ev.agentId) return a;
          const newOutput = a.output + ev.token;
          // auto-scroll output
          setTimeout(() => {
            const el = outputRefs.current[ev.agentId];
            if (el) el.scrollTop = el.scrollHeight;
          }, 0);
          return { ...a, output: newOutput };
        }));
        break;

      case "agent_done":
        setAgents(prev => prev.map(a =>
          a.id === ev.agentId ? { ...a, status: "done" } : a
        ));
        break;

      case "preview":
        setPreviewHtml(ev.html);
        setPreviewExpanded(true);
        onPreview?.(ev.html);
        break;

      case "done":
        setIsDone(true);
        onDone?.();
        break;

      case "error":
        setError(ev.message);
        setIsDone(true);
        onDone?.();
        break;
    }
  };

  const downloadHtml = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "grado-project.html";
    a.click();
  };

  return (
    <div className="w-full max-w-2xl mt-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#8B5CF6]/20 to-[#5B5BD6]/20 border border-[#5B5BD6]/30 rounded-full px-3 py-1">
          <span className="text-xs font-bold text-white tracking-tight">⚡ Multi-Agents Grado</span>
          {connecting && !error && <Loader2 className="w-3 h-3 animate-spin text-[#7B7BFF]" />}
          {!connecting && !isDone && !error && <Loader2 className="w-3 h-3 animate-spin text-[#7B7BFF]" />}
          {isDone && !error && <CheckCircle2 className="w-3 h-3 text-green-400" />}
        </div>
        {connecting && !error && (
          <span className="text-xs text-[#8888A8] animate-pulse">Connexion aux agents…</span>
        )}
        {!connecting && !isDone && (
          <span className="text-xs text-[#8888A8]">{agents.filter(a => a.status === "done").length}/{agents.length || 5} agents terminés</span>
        )}
        {isDone && !error && (
          <span className="text-xs text-green-400">Pipeline terminé</span>
        )}
      </div>

      {/* Agent cards */}
      <div className="space-y-2">
        {(agents.length === 0 ? [
          { id: "orchestrateur", name: "Orchestrateur", icon: "🎯", color: "#8B5CF6", task: connecting ? "Initialisation…" : "En attente de son tour", status: "pending" as const, output: "", index: 0 },
          { id: "architecte", name: "Architecte", icon: "🏗️", color: "#06B6D4", task: "En attente de son tour", status: "pending" as const, output: "", index: 1 },
          { id: "designer", name: "Designer UX", icon: "🎨", color: "#EC4899", task: "En attente de son tour", status: "pending" as const, output: "", index: 2 },
          { id: "codeur", name: "Codeur", icon: "💻", color: "#10B981", task: "En attente de son tour", status: "pending" as const, output: "", index: 3 },
          { id: "revieweur", name: "Revieweur", icon: "🔍", color: "#F59E0B", task: "En attente de son tour", status: "pending" as const, output: "", index: 4 },
        ] : agents).map((agent, i) => {
          const isExpanded = expandedAgent === agent.id;
          const isRunning = agent.status === "running";
          const isDoneAgent = agent.status === "done";
          const isPending = agent.status === "pending";

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-xl border overflow-hidden transition-all",
                isRunning ? "border-opacity-60 shadow-[0_0_20px_rgba(0,0,0,0.3)]" : "border-[#2a2a38]",
                isPending ? "opacity-40" : "opacity-100"
              )}
              style={{
                borderColor: isRunning ? agent.color + "60" : undefined,
              }}
            >
              {/* Card header */}
              <button
                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                disabled={!agent.output}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  isRunning
                    ? "bg-gradient-to-r from-[#111118] to-[#111118]"
                    : "bg-[#111118] hover:bg-[#16161f]",
                )}
                style={{
                  background: isRunning
                    ? `linear-gradient(90deg, ${agent.color}10 0%, #111118 100%)`
                    : undefined,
                }}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 font-medium"
                  style={{ background: agent.color + "20", boxShadow: isRunning ? `0 0 12px ${agent.color}40` : "none" }}
                >
                  {agent.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{agent.name}</span>
                    {isRunning && (
                      <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: agent.color, background: agent.color + "15" }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: agent.color }} />
                        En cours
                      </span>
                    )}
                    {isDoneAgent && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    )}
                    {isPending && (
                      <Circle className="w-3.5 h-3.5 text-[#5555A8]" />
                    )}
                  </div>
                  <p className="text-xs text-[#8888A8] truncate">{agent.task}</p>
                </div>

                {/* Expand toggle */}
                {agent.output && (
                  <div className="text-[#8888A8] shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                )}

                {/* Running progress bar */}
                {isRunning && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${agent.color}, ${agent.color}80)` }}
                      animate={{ width: ["0%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                )}
              </button>

              {/* Expandable output */}
              <AnimatePresence>
                {isExpanded && agent.output && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      ref={el => { outputRefs.current[agent.id] = el; }}
                      className="px-4 py-3 bg-[#0a0a10] border-t border-[#1e1e2a] max-h-[200px] overflow-y-auto"
                    >
                      <pre className="text-xs text-[#C8C8E8] font-mono leading-relaxed whitespace-pre-wrap break-words">
                        {agent.id === "codeur" || agent.id === "revieweur"
                          ? agent.output.replace(/```html[\s\S]*?```/g, "[Code HTML généré — voir la prévisualisation ↓]")
                          : agent.output}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Preview */}
      <AnimatePresence>
        {previewHtml && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            {/* Preview toolbar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-white">Projet généré par 4 agents IA</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadHtml}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/40 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  HTML
                </button>
                <button
                  onClick={() => setPreviewExpanded(v => !v)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/40 transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                  {previewExpanded ? "Réduire" : "Agrandir"}
                </button>
              </div>
            </div>

            {/* iframe preview */}
            <div
              className={cn(
                "rounded-xl overflow-hidden border border-[#5B5BD6]/20 shadow-[0_0_40px_rgba(91,91,214,0.1)] transition-all duration-300",
                previewExpanded ? "h-[500px]" : "h-[280px]"
              )}
            >
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                title="Grado Multi-Agent Preview"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
