import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Users, Mail, Calendar, RefreshCw, CreditCard, Check, X, AlertCircle, ChevronDown, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GradoLogo } from "@/components/grado-logo";
import { cn } from "@/lib/utils";

interface UserRow {
  id: number;
  name: string;
  email: string;
  plan: string;
  trialEndsAt: string | null;
  createdAt: string;
}

interface PaymentRow {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  plan: string;
  amount: number;
  reference: string;
  method: string;
  status: string;
  note: string | null;
  createdAt: string;
}

const PLAN_COLORS: Record<string, string> = {
  gratuit: "bg-[#1e1e2a] text-[#8888A8] border-[#2a2a38]",
  essentiel: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  createur: "bg-[#5B5BD6]/15 text-[#5B5BD6] border-[#5B5BD6]/30",
  fusion: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  elite: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { token, user: authUser } = useAuth();
  const [tab, setTab] = useState<"users" | "payments">("payments");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [count, setCount] = useState(0);
  const [visitors, setVisitors] = useState<{ since24h: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [planLoading, setPlanLoading] = useState<number | null>(null);
  const [openPlanSelect, setOpenPlanSelect] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, paymentsRes, statsRes] = await Promise.all([
        fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/payments/admin", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (usersRes.status === 403) throw new Error("403");
      if (!usersRes.ok) throw new Error("Erreur de chargement");
      const usersData = await usersRes.json();
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];
      const statsData = statsRes.ok ? await statsRes.json() : null;
      setUsers(usersData.users);
      setCount(usersData.count);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      if (statsData) setVisitors(statsData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approvePayment = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/payments/admin/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur");
      await load();
    } catch {
      alert("Erreur lors de l'approbation");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectPayment = async (id: number) => {
    if (!confirm("Rejeter ce paiement ?")) return;
    setActionLoading(id);
    try {
      await fetch(`/api/payments/admin/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: "Rejeté par admin" }),
      });
      await load();
    } catch {
      alert("Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: number, name: string) => {
    if (!window.confirm(`Supprimer définitivement le client « ${name} » et toutes ses données ? Cette action est irréversible.`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const d = await res.json().catch(() => null);
        alert(d?.error || "Erreur lors de la suppression");
      }
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
    }
  };

  const changePlan = async (userId: number, plan: string) => {
    setPlanLoading(userId);
    setOpenPlanSelect(null);
    try {
      await fetch(`/api/payments/admin/user/${userId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      await load();
    } catch {
      alert("Erreur");
    } finally {
      setPlanLoading(null);
    }
  };

  if (!loading && error === "403") {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-bold text-white">Accès refusé</h1>
        <p className="text-sm text-[#8888A8] max-w-sm">
          Cette page est réservée au gérant de Grado. Configure ton email admin dans les secrets Replit.
        </p>
        <button onClick={() => navigate("/chat")} className="mt-2 px-5 py-2.5 rounded-xl bg-[#5B5BD6] text-white text-sm font-medium hover:bg-[#4a4ac4] transition-colors">
          Retour au chat
        </button>
      </div>
    );
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const fmtTime = (d: string) =>
    new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

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

  const pendingCount = payments.filter(p => p.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#000000] text-white">

      <nav className="border-b border-[#1e1e2a]/80 bg-[#000000]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/chat")} className="flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white transition-colors">
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

      <main className="max-w-5xl mx-auto px-5 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-[#080808] border border-[#1e1e2a] rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[#8888A8] text-xs mb-2"><Users className="w-3.5 h-3.5" />Total inscrits</div>
            <p className="text-3xl font-bold text-white">{count}</p>
          </div>
          <div className="bg-[#080808] border border-[#1e1e2a] rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[#8888A8] text-xs mb-2"><Mail className="w-3.5 h-3.5" />En essai</div>
            <p className="text-3xl font-bold text-yellow-400">
              {users.filter(u => u.trialEndsAt && new Date(u.trialEndsAt).getTime() > Date.now()).length}
            </p>
          </div>
          <div className="bg-[#080808] border border-[#1e1e2a] rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[#8888A8] text-xs mb-2"><Calendar className="w-3.5 h-3.5" />Payants</div>
            <p className="text-3xl font-bold text-green-400">{users.filter(u => u.plan !== "gratuit").length}</p>
          </div>
          <div className={cn("bg-[#080808] border rounded-2xl p-5", pendingCount > 0 ? "border-yellow-500/40" : "border-[#1e1e2a]")}>
            <div className="flex items-center gap-2 text-[#8888A8] text-xs mb-2"><CreditCard className="w-3.5 h-3.5" />Paiements en attente</div>
            <p className={cn("text-3xl font-bold", pendingCount > 0 ? "text-yellow-400" : "text-white")}>{pendingCount}</p>
          </div>
        </div>

        {/* Visiteurs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#080808] border border-[#5B5BD6]/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[#8888A8] text-xs mb-2">
              <Eye className="w-3.5 h-3.5 text-[#7B7BFF]" />
              Visites dernières 24h
            </div>
            <p className="text-3xl font-bold text-[#7B7BFF]">
              {visitors ? visitors.since24h.toLocaleString("fr-FR") : "—"}
            </p>
            <p className="text-[10px] text-[#5555A8] mt-1">depuis hier jusqu'à maintenant</p>
          </div>
          <div className="bg-[#080808] border border-[#5B5BD6]/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[#8888A8] text-xs mb-2">
              <Eye className="w-3.5 h-3.5" />
              Visites totales
            </div>
            <p className="text-3xl font-bold text-white">
              {visitors ? visitors.total.toLocaleString("fr-FR") : "—"}
            </p>
            <p className="text-[10px] text-[#5555A8] mt-1">depuis le lancement jusqu'à l'infini</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#080808] border border-[#1e1e2a] rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab("payments")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors", tab === "payments" ? "bg-[#5B5BD6] text-white" : "text-[#8888A8] hover:text-white")}
          >
            <CreditCard className="w-4 h-4" />
            Paiements
            {pendingCount > 0 && <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
          <button
            onClick={() => setTab("users")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors", tab === "users" ? "bg-[#5B5BD6] text-white" : "text-[#8888A8] hover:text-white")}
          >
            <Users className="w-4 h-4" />
            Clients
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{tab === "payments" ? "Demandes de paiement" : "Tous les clients"}</h1>
          <button onClick={load} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/40 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </button>
        </div>

        {error && error !== "403" && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#8888A8]">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Chargement…
          </div>
        ) : tab === "payments" ? (
          <div className="bg-[#080808] border border-[#1e1e2a] rounded-2xl overflow-hidden">
            {payments.length === 0 ? (
              <div className="px-5 py-12 text-center text-[#8888A8]">
                <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>Aucune demande de paiement</p>
              </div>
            ) : (
              <div className="divide-y divide-[#0D0D0D]">
                {payments.map((p) => (
                  <div key={p.id} className={cn("px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3", p.status === "pending" && "bg-yellow-500/5")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{p.userName}</span>
                        <span className="text-xs text-[#8888A8]">{p.userEmail}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase", PLAN_COLORS[p.plan] || PLAN_COLORS.gratuit)}>
                          {p.plan}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-sm font-bold text-white">{p.amount} Dh</span>
                        <span className="font-mono text-xs text-[#7B7BFF]">{p.reference}</span>
                        <span className="text-xs text-[#8888A8]">{fmtTime(p.createdAt)}</span>
                      </div>
                      {p.note && <p className="text-xs text-red-400 mt-1">{p.note}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.status === "pending" ? (
                        <>
                          <button
                            onClick={() => approvePayment(p.id)}
                            disabled={actionLoading === p.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approuver
                          </button>
                          <button
                            onClick={() => rejectPayment(p.id)}
                            disabled={actionLoading === p.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Rejeter
                          </button>
                        </>
                      ) : (
                        <span className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold",
                          p.status === "approved" ? "bg-green-500/15 text-green-400 border border-green-500/30" :
                          p.status === "rejected" ? "bg-red-500/15 text-red-400 border border-red-500/30" :
                          "bg-[#1e1e2a] text-[#8888A8] border border-[#2a2a38]"
                        )}>
                          {p.status === "approved" ? "✓ Approuvé" : p.status === "rejected" ? "✗ Rejeté" : p.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#080808] border border-[#1e1e2a] rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-[#1e1e2a]">
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium">#</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium">Nom</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium">Plan</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium hidden sm:table-cell">Essai</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium hidden sm:table-cell">Inscrit le</th>
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className="border-b border-[#0D0D0D] last:border-0 hover:bg-[#0A0A0A] transition-colors">
                    <td className="px-5 py-3 text-[#5555A8]">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-white">{u.name}</td>
                    <td className="px-5 py-3 text-[#8888A8] font-mono text-xs hidden md:table-cell">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", PLAN_COLORS[u.plan] || PLAN_COLORS.gratuit)}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">{trialStatus(u) ?? <span className="text-[#4444A8] text-xs">—</span>}</td>
                    <td className="px-5 py-3 text-[#8888A8] text-xs hidden sm:table-cell">{fmt(u.createdAt)}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="relative flex items-center gap-2">
                        <button
                          onClick={() => setOpenPlanSelect(openPlanSelect === u.id ? null : u.id)}
                          disabled={planLoading === u.id}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#2a2a38] text-[#8888A8] hover:border-[#5B5BD6]/40 hover:text-white transition-colors disabled:opacity-50"
                        >
                          Changer <ChevronDown className="w-3 h-3" />
                        </button>
                        {openPlanSelect === u.id && (
                          <div className="absolute right-0 top-8 z-20 bg-[#0D0D0D] border border-[#2a2a38] rounded-xl shadow-xl overflow-hidden min-w-[120px]">
                            {["gratuit", "essentiel", "createur", "fusion", "elite"].map(plan => (
                              <button
                                key={plan}
                                onClick={() => changePlan(u.id, plan)}
                                className={cn(
                                  "w-full text-left px-3 py-2 text-xs hover:bg-[#5B5BD6]/20 transition-colors capitalize",
                                  u.plan === plan ? "text-[#7B7BFF] font-semibold" : "text-[#C8C8E8]"
                                )}
                              >
                                {plan} {u.plan === plan && "✓"}
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => deleteUser(u.id, u.name)}
                          disabled={actionLoading === u.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#8888A8]">Aucun client inscrit.</td>
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
