import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#000000] text-white px-6">
      <div className="flex items-center gap-3 mb-3">
        <AlertCircle className="h-8 w-8 text-[#5B5BD6]" />
        <h1 className="text-3xl font-extrabold">Page introuvable</h1>
      </div>
      <p className="text-sm text-[#8888A8] mb-8 text-center max-w-sm">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <a
        href="/"
        className="px-5 py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white text-sm font-semibold transition-colors"
      >
        Retour à l'accueil
      </a>
    </div>
  );
}
