import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Users, Mail, Calendar, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GradoLogo } from "@/components/grado-logo";

interface UserRow {
  id: number;
  name: string;
  email: string;
  plan: string;
  trialEndsAt: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { token } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setUsers(data.users);
      setCount(data.count);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const trialStatus = (u: UserRow) => {
    if (!u.trialEndsAt) return null;
    const now = Date.now();
    const end = new Date(u.trialEndsAt).getTime();
    if (end > now) {
      const h = Math.round((end - now) / 3600000);
      return <span className="text-yellow-400 text-xs">{h}h restantes</span>;
    }
    return <span className="text-[#5555A8] text-xs">Expiré</span>;
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#5B5BD6]/8 rounded-full blur-[120px] pointer-events-none" />

      <nav className="border-b border-[#1e1e2a]/80 bg-[#0D0D12]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <GradoLogo size={24} />
            <span className="font-bold text-white text-sm">Admin</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Clients</h1>
            <p className="text-sm text-[#8888A8]">Tous les comptes inscrits sur Grado</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/40 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#12121a] border border-[#1e1e2a] rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[#8888A8] text-xs mb-2">
              <Users className="w-3.5 h-3.5" />
              Total inscrits
            </div>
            <p className="text-3xl font-bold text-white">{count}</p>
          </div>
          <div className="bg-[#12121a] border border-[#1e1e2a] rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[#8888A8] text-xs mb-2">
              <Mail className="w-3.5 h-3.5" />
              En essai
            </div>
            <p className="text-3xl font-bold text-yellow-400">
              {users.filter(u => u.trialEndsAt && new Date(u.trialEndsAt).getTime() > Date.now()).length}
            </p>
          </div>
          <div className="bg-[#12121a] border border-[#1e1e2a] rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[#8888A8] text-xs mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Payants
            </div>
            <p className="text-3xl font-bold text-green-400">
              {users.filter(u => u.plan !== "gratuit").length}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#8888A8]">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Chargement…
          </div>
        ) : (
          <div className="bg-[#12121a] border border-[#1e1e2a] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e2a]">
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium">#</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium">Nom</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium">Plan</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium">Essai</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    className="border-b border-[#1a1a26] last:border-0 hover:bg-[#16161f] transition-colors"
                  >
                    <td className="px-5 py-3 text-[#5555A8]">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-white">{u.name}</td>
                    <td className="px-5 py-3 text-[#8888A8] font-mono text-xs">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        u.plan === "gratuit"
                          ? "bg-[#1e1e2a] text-[#8888A8] border-[#2a2a38]"
                          : "bg-[#5B5BD6]/15 text-[#5B5BD6] border-[#5B5BD6]/30"
                      }`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3">{trialStatus(u) ?? <span className="text-[#4444A8] text-xs">—</span>}</td>
                    <td className="px-5 py-3 text-[#8888A8] text-xs">{fmt(u.createdAt)}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#8888A8]">
                      Aucun client inscrit pour l'instant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
