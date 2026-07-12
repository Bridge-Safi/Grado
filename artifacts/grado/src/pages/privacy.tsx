import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { GradoLogo } from "@/components/grado-logo";

const SECTIONS = [
  {
    title: "1. Données collectées",
    body: `Grado collecte les données nécessaires au fonctionnement du service : votre email et mot de passe (chiffré) lors de l'inscription, les conversations et instructions que vous envoyez à l'IA, les applications, morceaux et vidéos que vous générez, ainsi que les informations liées à votre abonnement (plan, historique de paiement, date d'activation).`,
  },
  {
    title: "2. Utilisation des données",
    body: `Vos données sont utilisées pour : fournir et améliorer le service (génération de contenu, hébergement de vos sites), gérer votre compte et votre abonnement, assurer le support client, et respecter nos obligations légales. Nous ne vendons jamais vos données à des tiers.`,
  },
  {
    title: "3. Partage avec des tiers",
    body: `Pour générer du contenu, vos instructions peuvent être transmises à des fournisseurs de modèles d'intelligence artificielle tiers (par exemple des fournisseurs de modèles de langage, de musique ou de vidéo) dans le seul but de produire la réponse demandée. Ces fournisseurs traitent les données conformément à leurs propres politiques de confidentialité et ne sont pas autorisés à les utiliser à d'autres fins.`,
  },
  {
    title: "4. Conservation des données",
    body: `Vos données (compte, conversations, créations) sont conservées tant que votre compte est actif. Si vous supprimez votre compte, vos données personnelles sont supprimées ou anonymisées dans un délai raisonnable, sauf obligation légale de conservation plus longue (notamment comptable).`,
  },
  {
    title: "5. Sécurité",
    body: `Les mots de passe sont stockés sous forme chiffrée. Les échanges avec la plateforme sont sécurisés (HTTPS). Des mesures techniques et organisationnelles raisonnables sont mises en place pour protéger vos données contre l'accès non autorisé, la perte ou l'altération.`,
  },
  {
    title: "6. Cookies et sessions",
    body: `Grado utilise des cookies ou jetons de session strictement nécessaires au maintien de votre connexion et à la sécurité du service. Aucun cookie publicitaire ou de tracking tiers n'est utilisé.`,
  },
  {
    title: "7. Vos droits",
    body: `Vous pouvez à tout moment accéder à vos données, les corriger ou demander leur suppression, notamment depuis la page Paramètres de votre compte. Pour toute demande relative à vos données personnelles, contactez-nous via la page Contact.`,
  },
  {
    title: "8. Modifications",
    body: `Cette politique de confidentialité peut être mise à jour pour refléter des évolutions du service ou de la réglementation. La date de dernière mise à jour est indiquée en haut de cette page.`,
  },
];

export default function PrivacyPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e1e2a]/80 bg-[#000000]/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5">
            <GradoLogo size={22} />
            <span className="text-sm font-bold tracking-tight">Grado</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-[#8888A8] mb-12">Dernière mise à jour : 12 juillet 2026</p>

        <div className="space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold mb-2 text-white">{s.title}</h2>
              <p className="text-sm leading-relaxed text-[#A0A0B8]">{s.body}</p>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#1e1e2a] py-8 px-5">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <GradoLogo size={20} />
            <span className="text-sm font-semibold">Grado</span>
          </div>
          <div className="flex gap-6">
            <button onClick={() => navigate("/terms")} className="text-xs text-[#8888A8] hover:text-white transition-colors">CGU</button>
            <button onClick={() => navigate("/contact")} className="text-xs text-[#8888A8] hover:text-white transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
