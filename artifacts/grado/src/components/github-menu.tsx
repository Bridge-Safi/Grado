import { useEffect, useState } from "react";
import { GitFork as Github, Loader2, X, Upload, Download as DownloadIcon, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Repo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
  htmlUrl: string;
}

interface GithubMenuProps {
  token: string | null;
  html: string | null;
  conversationId: number | null;
  siteTitle?: string;
  /** Called with the imported HTML so the caller can inject it into the conversation/preview */
  onImport: (html: string, sourceLabel: string) => Promise<void> | void;
  compact?: boolean;
  align?: "top" | "bottom";
}

type Panel = null | "menu" | "export" | "import";

export function GithubMenu({ token, html, conversationId, siteTitle, onImport, compact = true, align = "bottom" }: GithubMenuProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const [repoName, setRepoName] = useState(siteTitle || "mon-site-grado");
  const [exporting, setExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState("");

  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [importError, setImportError] = useState("");
  const [importedOk, setImportedOk] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/github/status", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { connected: false })
      .then((d) => { setConnected(!!d.connected); setUsername(d.username || null); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [token]);

  // After returning from the OAuth redirect: /chat?github=connected
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("github");
    if (status === "connected" || status === "error") {
      params.delete("github");
      const newSearch = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (newSearch ? `?${newSearch}` : ""));
      if (status === "connected" && token) {
        fetch("/api/github/status", { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => { setConnected(!!d.connected); setUsername(d.username || null); setPanel("menu"); })
          .catch(() => {});
      }
    }
  }, [token]);

  const connect = () => {
    if (!token) return;
    window.location.href = `/api/github/connect?token=${encodeURIComponent(token)}`;
  };

  const openMenu = () => setPanel(panel ? null : "menu");

  const startExport = () => {
    setExportedUrl(null);
    setExportError("");
    setPanel("export");
  };

  const doExport = async () => {
    if (!html || !token) return;
    setExporting(true);
    setExportError("");
    try {
      const res = await fetch("/api/github/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ html, repoName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'export");
      setExportedUrl(data.repoUrl);
    } catch (e: any) {
      setExportError(e.message || "Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  const startImport = async () => {
    setPanel("import");
    setImportError("");
    setImportedOk(false);
    if (repos.length || !token) return;
    setReposLoading(true);
    try {
      const res = await fetch("/api/github/repos", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setRepos(data);
    } catch (e: any) {
      setImportError(e.message || "Erreur lors du chargement des dépôts");
    } finally {
      setReposLoading(false);
    }
  };

  const doImport = async (repo: Repo) => {
    if (!token) return;
    setImportingId(repo.id);
    setImportError("");
    try {
      const res = await fetch(`/api/github/import/${repo.owner}/${repo.name}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'import");
      await onImport(data.html, repo.fullName);
      setImportedOk(true);
      setTimeout(() => setPanel(null), 900);
    } catch (e: any) {
      setImportError(e.message || "Erreur lors de l'import");
    } finally {
      setImportingId(null);
    }
  };

  if (!checked) return null;

  return (
    <div className="relative">
      <button
        onClick={openMenu}
        title="GitHub"
        className={cn(
          "flex items-center justify-center gap-1 text-[10px] font-semibold rounded-md px-2 py-1 border transition-colors shrink-0 whitespace-nowrap",
          "text-[#8888A8] hover:text-white border-[#1e1e2a] hover:border-[#5B5BD6]/40"
        )}
        data-testid="button-github-menu"
      >
        <Github className="w-3 h-3 shrink-0" />
        <span className="hidden xl:inline">GitHub</span>
        {connected && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
      </button>

      <AnimatePresence>
        {panel && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute z-50 bg-[#1a1a24] border border-[#2a2a38] rounded-xl p-3 w-80 shadow-xl right-0",
              align === "top" ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" /> GitHub
                {connected && username && <span className="text-[#8888A8] font-normal">· @{username}</span>}
              </span>
              <button onClick={() => setPanel(null)} className="text-[#8888A8] hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {!connected ? (
              <div className="space-y-2">
                <p className="text-[11px] text-[#8888A8]">
                  Connecte ton compte GitHub pour exporter ce site vers un dépôt, ou importer un projet existant à modifier dans Grado.
                </p>
                <button
                  onClick={connect}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-[#eaeaea] text-black text-xs font-semibold transition-colors"
                >
                  <Github className="w-3.5 h-3.5" /> Connecter GitHub
                </button>
              </div>
            ) : panel === "menu" ? (
              <div className="space-y-1.5">
                <button
                  onClick={startExport}
                  disabled={!html}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ffffff0a] text-left text-xs font-medium text-[#E8E8F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#5B5BD6]" />
                  <div>
                    <div>Exporter vers GitHub</div>
                    <div className="text-[10px] text-[#8888A8] font-normal">Pousser ce site dans un nouveau dépôt</div>
                  </div>
                </button>
                <button
                  onClick={startImport}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ffffff0a] text-left text-xs font-medium text-[#E8E8F0] transition-colors"
                >
                  <DownloadIcon className="w-3.5 h-3.5 text-[#5B5BD6]" />
                  <div>
                    <div>Importer depuis GitHub</div>
                    <div className="text-[10px] text-[#8888A8] font-normal">Charger un dépôt existant dans la conversation</div>
                  </div>
                </button>
              </div>
            ) : panel === "export" ? (
              <div className="space-y-2">
                {exportedUrl ? (
                  <div className="text-center py-2">
                    <Check className="w-6 h-6 text-green-400 mx-auto mb-1.5" />
                    <p className="text-xs text-white font-medium mb-2">Site exporté !</p>
                    <a
                      href={exportedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#7B7BFF] hover:underline"
                    >
                      Voir le dépôt <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <>
                    <label className="text-[10px] text-[#8888A8]">Nom du dépôt</label>
                    <input
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      className="w-full bg-[#000000] border border-[#2a2a38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#5B5BD6]/50"
                      placeholder="mon-site-grado"
                    />
                    {exportError && <p className="text-[10px] text-red-400">{exportError}</p>}
                    <button
                      onClick={doExport}
                      disabled={exporting || !repoName.trim()}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {exporting ? "Envoi en cours…" : "Créer le dépôt"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {reposLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 text-[#5B5BD6] animate-spin" />
                  </div>
                ) : importError ? (
                  <p className="text-[10px] text-red-400">{importError}</p>
                ) : repos.length === 0 ? (
                  <p className="text-[11px] text-[#8888A8] text-center py-3">Aucun dépôt trouvé.</p>
                ) : (
                  repos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => doImport(repo)}
                      disabled={importingId !== null}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[#ffffff0a] text-left transition-colors disabled:opacity-50"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-white font-medium truncate">{repo.name}</div>
                        <div className="text-[10px] text-[#8888A8]">{repo.private ? "Privé" : "Public"}</div>
                      </div>
                      {importingId === repo.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#5B5BD6] animate-spin shrink-0" />
                      ) : importedOk && importingId === null ? (
                        <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      ) : (
                        <DownloadIcon className="w-3.5 h-3.5 text-[#8888A8] shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
