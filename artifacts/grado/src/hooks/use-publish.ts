import { useState } from "react";

/**
 * Shared publish/download logic for a generated HTML project.
 * Used by both the inline chat preview card and the live "Aperçu en direct" panel.
 */
export function usePublish(html: string) {
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grado-project.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyUrl = async (url: string) => {
    const full = `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handlePublishClick = () => {
    if (publishedUrl) {
      copyUrl(publishedUrl);
      return;
    }
    setShowModal(true);
  };

  const handleConfirmPublish = async () => {
    const token = localStorage.getItem("grado_token");
    setIsPublishing(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title: title || "Mon site Grado", htmlContent: html }),
      });
      const data = await res.json();
      const siteUrl = data.url;
      setPublishedUrl(siteUrl);
      setShowModal(false);
      await copyUrl(siteUrl);
    } catch (e) {
      console.error("Publish failed", e);
    } finally {
      setIsPublishing(false);
    }
  };

  const fullUrl = publishedUrl ? `${window.location.origin}${publishedUrl}` : null;

  return {
    publishedUrl,
    isPublishing,
    copied,
    showModal,
    setShowModal,
    title,
    setTitle,
    fullUrl,
    handleDownload,
    handlePublishClick,
    handleConfirmPublish,
  };
}
