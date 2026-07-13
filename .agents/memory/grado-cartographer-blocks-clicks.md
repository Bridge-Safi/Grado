---
name: Cartographier bloque les clics dans la preview Replit
description: Le plugin cartographer intercepte tous les clics quand le mode "inspection" est actif, rendant tous les boutons inactifs.
---

## Rule
Retirer `@replit/vite-plugin-cartographer` de `artifacts/grado/vite.config.ts`. Le garder casse la navigation dans la preview Replit quand le mode "Sélectionner un élément" est actif.

**Why:** Le plugin ajoute un `addEventListener('click', handler, { capture: true })`. Quand `this.isActive === true` (mode inspection activé par le parent Replit via postMessage), le handler appelle `preventDefault()` + `stopPropagation()` — ce qui tue tous les clics avant qu'ils n'atteignent React.

**How to apply:**
- Ne pas réintroduire le cartographer dans vite.config.ts pour l'artifact grado.
- Le `@replit/vite-plugin-dev-banner` est conservé (il n'intercepte pas les clics).
- Si un futur agent réintroduit le cartographer et que les boutons ne fonctionnent plus, c'est la cause.
