import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { GradoLogo } from "@/components/grado-logo";

const SECTIONS = [
  {
    title: "1. Objet",
    body: `Les présentes conditions générales d'utilisation (« CGU ») régissent l'accès et l'utilisation de la plateforme Grado, un service qui permet de générer des applications, de la musique et des vidéos à l'aide de l'intelligence artificielle à partir d'instructions en langage naturel. En créant un compte ou en utilisant Grado, vous acceptez sans réserve les présentes CGU.`,
  },
  {
    title: "2. Compte utilisateur",
    body: `L'utilisation de Grado nécessite la création d'un compte avec une adresse email valide. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte. Vous devez nous informer sans délai de toute utilisation non autorisée de votre compte.`,
  },
  {
    title: "3. Offres et abonnements",
    body: `Grado propose une offre gratuite avec quota limité (créations, chansons, hébergement) ainsi que plusieurs offres payantes (Essentiel, Créateur, Fusion, Élite) décrites sur la page Tarifs. Les paiements s'effectuent par virement bancaire ou QR code ; l'activation du plan intervient sous 24h après vérification du paiement par notre équipe. Les prix sont indiqués en dirhams marocains (Dh), toutes taxes comprises sauf mention contraire.`,
  },
  {
    title: "4. Contenus générés",
    body: `Les applications, morceaux de musique, vidéos et autres contenus générés à partir de vos instructions vous appartiennent, sous réserve des droits des tiers (bibliothèques, modèles, contenus protégés) et du respect des présentes CGU. Grado ne revendique aucune propriété sur vos créations. Vous restez seul responsable du contenu que vous générez et publiez via la plateforme.`,
  },
  {
    title: "5. Usage interdit",
    body: `Il est interdit d'utiliser Grado pour générer ou héberger des contenus illégaux, diffamatoires, haineux, frauduleux, portant atteinte aux droits d'un tiers, ou visant à contourner les quotas et limitations techniques du service. Grado se réserve le droit de suspendre ou supprimer tout compte ne respectant pas ces règles.`,
  },
  {
    title: "6. Hébergement des sites générés",
    body: `Selon votre plan, Grado héberge un nombre limité ou illimité de sites générés, accessibles via un sous-domaine ou un domaine personnalisé. Grado met tout en œuvre pour assurer la disponibilité du service mais ne garantit pas une disponibilité continue à 100 %.`,
  },
  {
    title: "7. Résiliation",
    body: `Vous pouvez supprimer votre compte à tout moment depuis les Paramètres. Grado peut suspendre ou résilier l'accès à un compte en cas de non-respect des présentes CGU, de non-paiement, ou d'usage abusif du service.`,
  },
  {
    title: "8. Limitation de responsabilité",
    body: `Les contenus générés par intelligence artificielle peuvent comporter des erreurs, inexactitudes ou imperfections techniques. Grado est fourni « en l'état », sans garantie d'adéquation à un usage particulier. Grado ne pourra être tenu responsable des dommages indirects résultant de l'utilisation du service.`,
  },
  {
    title: "9. Modification des CGU",
    body: `Grado peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés des changements importants. La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles CGU.`,
  },
  {
    title: "10. Contact",
    body: `Pour toute question relative aux présentes CGU, vous pouvez nous contacter via la page Contact.`,
  },
];

export default function TermsPage() {
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
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Conditions générales d'utilisation</h1>
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
            <button onClick={() => navigate("/privacy")} className="text-xs text-[#8888A8] hover:text-white transition-colors">Confidentialité</button>
            <button onClick={() => navigate("/contact")} className="text-xs text-[#8888A8] hover:text-white transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
