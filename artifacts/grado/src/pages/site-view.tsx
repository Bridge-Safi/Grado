import { useEffect } from "react";
import { useParams } from "wouter";

export default function SiteViewPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  useEffect(() => {
    // Redirect to the API route that serves the raw HTML
    window.location.replace(`/api/sites/pub/${slug}`);
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center">
      <div className="text-[#8888A8] text-sm">Chargement du site...</div>
    </div>
  );
}
