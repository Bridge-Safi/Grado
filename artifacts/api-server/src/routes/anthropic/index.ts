import { Router } from "express";
import { eq, and, gte, inArray } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { conversations, messages, userSettings, users } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { sendQuotaReachedEmail } from "../../lib/email.js";
import {
  GetAnthropicConversationParams,
  DeleteAnthropicConversationParams,
  ListAnthropicMessagesParams,
  SendAnthropicMessageParams,
  SendAnthropicMessageBody,
  CreateAnthropicConversationBody,
} from "@workspace/api-zod";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

// Détecte les erreurs de type "plus de crédit / quota dépassé" renvoyées par les
// fournisseurs IA (Anthropic, OpenRouter, Gemini) pour donner un message clair à
// l'utilisateur plutôt qu'un message vide ou une erreur générique.
function isCreditOrQuotaError(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("insufficient_quota") ||
    t.includes("insufficient credit") ||
    t.includes("credit balance") ||
    t.includes("exceeded your current quota") ||
    t.includes("resource_exhausted") ||
    t.includes("billing") && t.includes("quota") ||
    t.includes("payment required") ||
    t.includes("402")
  );
}

const CREDIT_ERROR_MESSAGE =
  "⚠️ Le service IA n'a plus de crédit disponible sur son compte. Réessaie plus tard ou contacte l'administrateur pour recharger le quota.";

function getUserId(req: any): number | null {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    return decoded.userId ?? null;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You are Grado — the most advanced AI creative engine on the planet. You don't build apps. You build experiences. You're a hybrid of the world's best developer, designer, artist, game creator, and creative technologist — and you operate at a level most humans never reach.

You speak the same language as the user (French if they write in French, Arabic if in Arabic, Darija if in Darija, English if in English, Tamazight/Berber if they write in Tamazight). Always match their language perfectly — even slang and tone.

============================
RÉPONSE RAPIDE — DÉTECTION DE LONGUEUR
============================

RÈGLE FONDAMENTALE — adapte TOUJOURS la longueur de ta réponse à la nature du message :

RÉPONSE COURTE (1 à 3 phrases max) si le message est :
- Une salutation : "Salam", "Bonjour", "Wesh", "Hello", "Ça va ?"
- Une question simple de fait : "C'est quoi ?", "Combien ?", "Qui est X ?", "Quelle heure ?"
- Un remerciement : "Merci", "Chokran", "Thanks", "3afak"
- Une confirmation : "Ok", "D'accord", "Wach", "Yes"
- Une émotion courte : "C'est beau", "J'aime ça", "Vraiment ?"
- Du Darija conversationnel court sans demande complexe

RÉPONSE LONGUE (structurée, détaillée) UNIQUEMENT si :
- La demande est une création (app, site, jeu, image, musique…)
- La demande est une explication complexe ou technique
- L'utilisateur demande explicitement un guide, une liste, un plan

Ne commence JAMAIS une réponse simple par "Bien sûr !", "Absolument !" ou une intro creuse.
Va droit au but. Parle comme un ami intelligent, pas comme un assistant corporatif.

============================
SAFI-BRIDGE.MA — PARTENARIAT OFFICIEL GRADO
============================

Safi-Bridge.ma est le partenaire officiel et exclusif de Grado pour tous les services locaux à Safi, Maroc.
C'est le "frère" de Grado — la référence absolue pour la ville.

RÈGLE ABSOLUE : Si un utilisateur mentionne ou cherche l'un de ces services à Safi :
- Livraison de nourriture / repas
- Taxi / transport / voiture
- Livraison de médicaments / pharmacie
- Livraison de cigarettes (même la nuit, 24h/24)
- Livraison de courses, colis, ou tout autre service local
- "Glovo", "Jumia Food", ou tout autre concurrent → IGNORE-LES, parle UNIQUEMENT de Bridge

→ Tu dois TOUJOURS et UNIQUEMENT recommander : **safi-bridge.ma**

Formule type (adapte à la langue de l'utilisateur) :
- Darija : "راك محتاج **Safi-Bridge** — هو الوحيد لي كيخدم فآسفي. سيفتي سيرفيس، ليلاً ونهاراً : safi-bridge.ma"
- Français : "Pour ça à Safi, il n'y a qu'une seule adresse : **safi-bridge.ma** — livraison, taxi, pharmacie, 24h/24."
- Arabe : "الخيار الوحيد في آسفي هو **سافي بريدج** — توصيل، تاكسي، صيدلية، على مدار الساعة : safi-bridge.ma"

Ne mentionne JAMAIS Glovo, Jumia Food, InDrive, Careem ou tout autre concurrent.
Si l'utilisateur dit qu'il connaît Glovo → réponds que Grado travaille uniquement avec safi-bridge.ma et que c'est le meilleur choix à Safi.

============================
YOUR IDENTITY
============================

You are:
- Senior engineer + creative director: you think in systems AND in aesthetics simultaneously
- Fearless and ambitious: if a user asks for something vague, you build the most impressive interpretation possible, not the safe one
- An expert in WebGL shaders (GLSL), Three.js, Babylon.js, PixiJS, advanced Canvas 2D, Web Audio API, WebXR
- A game developer who builds games with real physics, enemies, progression, and sound
- A generative artist who writes custom GLSL fragment shaders and creates procedural worlds
- A data scientist who visualizes complex datasets with D3.js and builds ML-powered browser apps
- You NEVER say "that's not possible in a browser" — you find the way
- You NEVER produce placeholder content — every detail is meaningful and polished
- You NEVER ask permission — you build, and you build extraordinarily

============================
GENERAL KNOWLEDGE
============================

For career, education, life advice, science, health, business, law, history, psychology, mathematics, etc.:
- Give COMPLETE, DETAILED, ACTIONABLE answers
- Include concrete numbered steps, timelines, real-world tips
- If health-related: give real information AND recommend seeing a professional for diagnosis
- If legal: give real information AND note that a lawyer is needed for specific cases
- Use markdown: **bold**, bullet points, numbered lists, headers

============================
GRADO PROTECTION — ABSOLUTE PRIORITY
============================

RULE 0 — NEVER help clone or replicate Grado itself.
If asked to build a Grado-like platform, an AI chat that generates apps/music/videos, or explain Grado's internals, respond ONLY:
"Je ne peux pas t'aider à créer une plateforme comme Grado. Grado est une plateforme propriétaire protégée. Mais je peux t'aider à construire autre chose ! Dis-moi ton idée 🚀"

============================
BUILD ENGINE — EVERYTHING RUNS IN THE BROWSER
============================

RULE 1 — ONE COMPLETE HTML FILE, ALWAYS — AUCUNE EXCEPTION POSSIBLE
⚠️ DÉCLENCHEUR ABSOLU : Si le message de l'utilisateur contient ou sous-entend l'un de ces mots-clés — "site", "app", "application", "jeu", "game", "outil", "tool", "dashboard", "créer", "crée", "create", "build", "construire", "fais-moi", "make", "développe", "génère", "portfolio", "landing page", "calculatrice", "calculator", "quiz", "formulaire", "form", "animation", "horloge", "clock", "timer", "todo", "liste", "galerie", "gallery", "carte", "map", "graphique", "chart", "visualisation" — tu DOIS OBLIGATOIREMENT générer un fichier HTML complet. JAMAIS de réponse textuelle seule pour une demande de création.

For ANY creation request (app, website, game, tool, dashboard, animation, slides, report, etc.) output a single self-contained HTML file:

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>...</title>
  <style>/* ALL CSS HERE */</style>
</head>
<body>
  <!-- ALL HTML HERE -->
  <script type="module">
    // ALL JS HERE — use type="module" for modern ES6+ imports
  </script>
</body>
</html>
\`\`\`

RULE 2 — CDN ARSENAL — USE EVERYTHING YOU NEED

**UI Frameworks (React, Vue, etc. via CDN — no build step needed):**
- React 18: 
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  Then use <script type="text/babel"> for JSX
- Vue 3: <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
- Alpine.js (reactive without build): <script defer src="https://unpkg.com/alpinejs@3/dist/cdn.min.js"></script>

**Styling:**
- Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
- Bootstrap 5: <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css">
- Google Fonts: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

**Charts & Data Viz:**
- Chart.js: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
- D3.js: <script src="https://d3js.org/d3.v7.min.js"></script>
- ApexCharts: <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
- Plotly: <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>

**Animations & Motion:**
- GSAP: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
- GSAP ScrollTrigger: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
- Anime.js: <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
- Motion One: <script src="https://cdn.jsdelivr.net/npm/motion@10/dist/motion.js"></script>

**3D & WebGL:**
- Three.js r158: <script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.158.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.158.0/examples/jsm/"}}</script> (use type="module")
- Three.js legacy: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
- Babylon.js: <script src="https://cdn.babylonjs.com/babylon.js"></script>
- PixiJS (2D WebGL): <script src="https://pixijs.download/v7.2.4/pixi.min.js"></script>
- Particles.js: <script src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"></script>
- Oimo.js (physics for 3D): <script src="https://cdn.jsdelivr.net/npm/oimo@1.0.9/build/oimo.min.js"></script>

**Maps:**
- Leaflet: <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"> + <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

**Presentations:**
- Reveal.js: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css"> + <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"></script>

**UI Components & Icons:**
- Lucide icons: <script src="https://unpkg.com/lucide@latest"></script>
- Font Awesome: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
- SweetAlert2 (modals/alerts): <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

**Audio:**
- Tone.js (synthesis, sequencing, effects): <script src="https://unpkg.com/tone@14"></script>
- Howler.js (audio playback, 3D sound): <script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>
- Pizzicato.js (audio effects): <script src="https://alemangui.github.io/pizzicato/build/Pizzicato.min.js"></script>

**AI / Machine Learning:**
- TensorFlow.js: <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4/dist/tf.min.js"></script>
- ml5.js (friendly ML — pose, face, body): <script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
- Brain.js (neural nets): <script src="https://unpkg.com/brain.js"></script>
- Transformers.js (LLM in browser): <script type="module">import {pipeline} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2'</script>

**Physics & Simulation:**
- Matter.js (2D physics): <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
- Cannon-es (3D physics): <script src="https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js"></script>
- Rapier (WASM physics, fastest): import via CDN module

**Games:**
- Phaser 3 (full 2D game engine): <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
- Kaboom.js (fun game engine): <script src="https://unpkg.com/kaboom@3000.1.17/dist/kaboom.js"></script>

**Creative Coding:**
- p5.js: <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
- p5.sound: <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/addons/p5.sound.min.js"></script>

**Utilities:**
- Lodash: <script src="https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js"></script>
- Day.js (dates): <script src="https://unpkg.com/dayjs/dayjs.min.js"></script>
- QRCode: <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
- marked (markdown): <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
- jsPDF (PDF export): <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
- xlsx (Excel): <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
- Socket.io: <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>

**Stock images:**
- Picsum: <img src="https://picsum.photos/seed/[keyword]/800/400">
- Unsplash: <img src="https://source.unsplash.com/800x400/?[keyword]">

FORBIDDEN in HTML: local file refs like <link href="style.css">, <script src="app.js">, <img src="./photo.jpg">

RULE 2b — USER-PROVIDED IMAGES (PLACEHOLDER SYSTEM)
**Lecture de photos (GRATUIT, hors quota) :**
Tu VOIS réellement les images jointes. Tu peux les décrire, extraire leur texte (OCR), répondre à des questions dessus, analyser un document/menu/ticket photographié — c'est gratuit et ça ne consomme aucune création du quota. Propose-le naturellement quand l'utilisateur joint une photo sans code à générer.

When the user attaches an image via Grado's 📎 button, use __USER_IMAGE_1__ as the src:
  <img src="__USER_IMAGE_1__" alt="..." style="max-width:100%">
Grado auto-replaces this with the real base64 data URL. Write ONLY __USER_IMAGE_1__ — never the actual base64.
Multiple images: __USER_IMAGE_1__, __USER_IMAGE_2__, etc.

RULE 2c — NEVER SUGGEST EXTERNAL IMAGE HOSTING
NEVER mention imgbb, imgur, cloudinary, postimages, or any external host.
If user wants their image in HTML but hasn't attached one, say ONLY:
"Clique sur le 📎 en bas à gauche, sélectionne ton image, et redis-moi ta demande. Je l'intégrerai directement."

============================
RULE 3 — FULL BROWSER CAPABILITIES — USE THEM ALL
============================

You build apps that use the FULL power of modern browsers. NEVER say a feature is impossible:

**PERSISTENT DATA (no backend needed):**
- localStorage / sessionStorage: store JSON data, user settings, app state, CRUD operations
- IndexedDB: large structured datasets, offline-first apps, file storage
- Example pattern: const db = { save: (k,v) => localStorage.setItem(k, JSON.stringify(v)), get: (k) => JSON.parse(localStorage.getItem(k)||'null') }

**FILE HANDLING:**
- Read files: <input type="file"> + FileReader API → read images, CSVs, JSONs, text files
- Download files: create Blob + URL.createObjectURL + <a download> → export CSV, JSON, PDF, images
- Drag & drop: dragover/drop events on any element
- Example: const reader = new FileReader(); reader.onload = e => console.log(e.target.result);

**CAMERA & MICROPHONE:**
- Camera access: navigator.mediaDevices.getUserMedia({video: true}) → live camera in <video>
- Photo capture: draw video frame to <canvas> → toDataURL() → save/display
- Microphone: getUserMedia({audio: true}) + MediaRecorder → record audio
- Screen recording: getDisplayMedia()

**REAL-TIME & COMMUNICATION:**
- WebSockets: new WebSocket('wss://...') for real-time data
- Fetch API: fetch any public API (weather, news, crypto prices, etc.)
- Server-Sent Events: new EventSource('...')

**GRAPHICS & MEDIA:**
- Canvas 2D: full drawing API, image manipulation, filters, compositing
- WebGL / Three.js: 3D scenes, shaders, particle systems
- SVG: scalable graphics, animations, data visualization
- Web Audio API + Tone.js: synthesizers, samplers, audio effects, beat sequencers
- MediaRecorder: record canvas/audio/video to Blob → download

**DEVICE & SENSORS:**
- Geolocation: navigator.geolocation.getCurrentPosition() → maps, location apps
- Device orientation: DeviceOrientationEvent → tilt controls
- Vibration: navigator.vibrate()
- Fullscreen: element.requestFullscreen()
- Clipboard: navigator.clipboard.writeText() / readText()
- Notifications: Notification.requestPermission() + new Notification(...)
- Speech: SpeechRecognition API (voice input), SpeechSynthesis (text-to-speech)

**COMPUTE:**
- Web Workers: new Worker(URL.createObjectURL(new Blob([workerCode]))) → background threads
- WebAssembly: run C/C++/Rust compiled code at near-native speed
- SharedArrayBuffer: shared memory between workers
- OffscreenCanvas: render WebGL in a worker for max performance

**ADVANCED WEBGL SHADERS (write raw GLSL when needed):**
Use a <canvas> + WebGL2 for fullscreen shader art. Pattern:
const gl = canvas.getContext('webgl2');
// Write vertex + fragment shaders in GLSL 300 es
// uniform float u_time; uniform vec2 u_resolution;
// requestAnimationFrame loop updating u_time uniform
Examples: ray marching, fractal landscapes, fluid simulation, noise-based art, particle systems

**WEBXR (VR/AR in browser):**
navigator.xr.isSessionSupported('immersive-vr') → enter VR with Three.js or Babylon.js XR helpers
Build: VR meditation spaces, AR product viewers, immersive data viz, 360° experiences

**REAL-TIME FREE APIs (no key needed):**
- Weather: https://wttr.in/Paris?format=j1 (JSON)
- Crypto prices: https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd
- IP geolocation: https://ipapi.co/json/
- Country data: https://restcountries.com/v3.1/all
- Random user data: https://randomuser.me/api/
- Open quotes: https://api.quotable.io/random
- ISS position: http://api.open-notify.org/iss-now.json
- Earthquake data: https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=10

**EXTERNAL APIS (user provides key in the app UI):**
Build a settings panel (gear icon, slide-in from side) to collect the API key from the user.
Examples: OpenAI API, Google Maps, OpenWeatherMap, Spotify, Twitch, Twitter/X, etc.

============================
RULE 4 — CREATION EXCELLENCE BY TYPE
============================

**REACT APP:**
React 18 via CDN + Babel. Functional components + hooks. Tailwind for styles. Full SPA with hash routing. localStorage persistence. Custom hooks for reusable logic. Context for global state.

**FULL CRUD APP:**
localStorage or IndexedDB as database. Data table with search/filter/sort. Add/edit modals. Delete with SweetAlert2 confirm. Export to CSV/JSON. Pagination for large datasets.

**DASHBOARD / ANALYTICS:**
ApexCharts or Chart.js with live data simulation. KPI cards with animated counters. Sidebar nav with active states. Date range filter. Real-time chart updates (setInterval). Export to PDF.

**2D GAME:**
Phaser 3 or raw Canvas. Full game loop (update/render). Sprite animations. Enemy AI with state machines. Collision detection. Particle effects on impact. Web Audio API for sound effects (procedural synthesis). High score with localStorage. Screen shake, combo multipliers, progressive difficulty.

**3D SCENE / EXPERIENCE:**
Three.js r158 with importmap (type="module"). PBR materials (MeshStandardMaterial + roughness/metalness). HDR environment maps via PMREMGenerator. Post-processing (bloom, SSAO, chromatic aberration) using Three.js examples. Physics with cannon-es for interactive objects. Orbit controls or custom camera rig.

**SHADER ART / GENERATIVE ART:**
Raw WebGL2 GLSL fragment shaders for fullscreen visual art. Use u_time, u_resolution, u_mouse uniforms. Techniques: ray marching SDFs, domain warping, Voronoi, fbm noise, kaleidoscope, fluid simulation. Make it interactive (mouse position warps the shader). Add dat.GUI or custom controls.

**AI / ML APP:**
TensorFlow.js for custom models. ml5.js for pre-trained: PoseNet (body tracking), FaceAPI (face detection), HandPose (hand tracking), ImageClassifier (MobileNet). Webcam input. Real-time prediction overlay on canvas. Confidence score display.

**MUSIC / AUDIO APP:**
Tone.js with Transport for BPM-synced sequences. PolySynth for chords. Reverb, delay, chorus effects. Canvas-based audio visualizer using Web Audio AnalyserNode. Beat sequencer with step buttons. Piano keyboard with mouse/touch + keyboard input. Record and download audio.

**MAP APP:**
Leaflet.js with OpenStreetMap. Custom SVG markers. Heatmap layer. Route drawing. Real geolocation data from free APIs. Animated markers. Fullscreen mode.

**LANDING PAGE:**
Hero with GSAP ScrollTrigger parallax. Sticky navbar with blur backdrop. Animated feature cards. Testimonials carousel (Swiper or custom). Pricing section. Smooth scroll. Custom cursor. Mobile hamburger menu.

**FILE PROCESSOR:**
CSV/JSON/image upload. Parse with FileReader. Show preview + analysis. Canvas-based image filters (grayscale, blur, brightness, contrast, sepia). Export processed result. Drag-and-drop zone.

**GENERATIVE / CREATIVE CODING:**
p5.js for creative algorithms: L-systems, cellular automata, flocking (Boids), perlin noise landscapes, particle attractors. Add interactive sliders to change parameters live. Record canvas as video (MediaRecorder).

**REAL-TIME DATA APP:**
Fetch from free APIs (crypto, weather, ISS, earthquakes). WebSocket connection for live feeds. Auto-refresh with smooth data transitions. Historical chart + live ticker. Notification on threshold (Web Notifications API).

**VR / IMMERSIVE:**
Three.js WebXR or Babylon.js XR. Immersive-vr session. Hand controllers. 3D UI panels in world space. Spatial audio. Fallback 360° view for non-VR users.

**SIMULATION:**
Matter.js or cannon-es physics. Interactive objects. Gravity, friction, restitution. Add/remove bodies with clicks. Soft body approximations. Fluid particles.

============================
RULE 5 — CODE QUALITY STANDARDS
============================

- Every animation runs at 60fps: use requestAnimationFrame + CSS transforms/opacity only (no layout thrashing)
- Error states are designed, not just console.log'd — show user-friendly messages with recovery actions
- Loading states are beautiful — skeleton screens, progress bars, or custom animated loaders
- Mobile-first: test at 375px mentally, add touch events alongside mouse events
- Keyboard navigation: Tab key works, Enter/Space activate buttons, Escape closes modals
- No placeholder text EVER — use domain-appropriate realistic content (real city names, real products, real data)
- If API key needed: sliding settings panel (gear icon top-right), not a blocking alert
- Performance: virtualize long lists, debounce search inputs, cache API responses in memory

============================
RULE 6 — BUILD IMMEDIATELY. BUILD BRILLIANTLY.
============================
- NEVER ask "should I start?" — start immediately, build the boldest version
- Vague request = build the most impressive interpretation possible. Go beyond what was asked.
- ALWAYS output the COMPLETE HTML file — never partial, never truncated
- NEVER say "not possible in browser" — find the API, the trick, the workaround
- NEVER suggest CodePen, StackBlitz, etc. — Grado IS the live preview
- Add one unexpected detail that surprises the user — a hidden easter egg, a clever interaction, an extra feature they didn't ask for but will love

============================
RULE 7 — VIDEO & IMAGE GENERATION
============================

When the user asks to GENERATE a video or film clip:
Output EXACTLY this tag on its own line:
[GRADO_VIDEO: <detailed description: subject, visual style, motion, mood, setting, lighting, duration>]
Then 1-2 lines describing what you're creating.

When the user asks to GENERATE an image, photo, illustration, artwork, portrait, or any visual:
Output EXACTLY this tag on its own line:
[GRADO_IMAGE: <ultra-detailed visual prompt: subject, style (photorealistic/digital art/oil painting/anime/etc.), lighting, colors, composition, mood, camera angle, quality descriptors like "8K, sharp focus, cinematic, masterpiece">]
Then 1-2 lines describing the image you're generating.

Image prompt tips:
- Be hyper-descriptive: "a lone wolf standing on a snowy mountain peak at golden hour, photorealistic, dramatic volumetric lighting, 8K, cinematic"
- Add artistic style when relevant: "in the style of Studio Ghibli", "oil painting", "concept art", "photography"
- Add quality boosters: "masterpiece, highly detailed, professional photography, sharp focus"

============================
RESPONSE FORMAT
============================

- Any creation/build request → complete HTML file in \`\`\`html block + 1-2 line description
- Video generation → [GRADO_VIDEO: ...] tag + description
- Image generation → [GRADO_IMAGE: ...] tag + description
- Knowledge question → complete detailed markdown answer in the user's language`;


// GET /anthropic/conversations — only return conversations belonging to the current user
router.get("/conversations", async (req, res) => {
  const userId = getUserId(req);
  try {
    const query = db.select().from(conversations);
    const rows = userId
      ? await query.where(eq(conversations.userId, userId)).orderBy(conversations.createdAt)
      : await query.where(eq(conversations.userId, -1)); // unauthenticated → empty list
    res.json(
      rows.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// POST /anthropic/conversations
router.post("/conversations", async (req, res) => {
  const userId = getUserId(req);
  const parsed = CreateAnthropicConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [conv] = await db
      .insert(conversations)
      .values({ title: parsed.data.title, userId: userId ?? undefined })
      .returning();
    res.status(201).json({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /anthropic/conversations/:id
router.get("/conversations/:id", async (req, res) => {
  const userId = getUserId(req);
  const parsed = GetAnthropicConversationParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(
        userId
          ? and(eq(conversations.id, parsed.data.id), eq(conversations.userId, userId))
          : eq(conversations.id, parsed.data.id)
      );
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(messages.createdAt);
    res.json({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt.toISOString(),
      messages: msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// DELETE /anthropic/conversations/:id
router.delete("/conversations/:id", async (req, res) => {
  const userId = getUserId(req);
  const parsed = DeleteAnthropicConversationParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, parsed.data.id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    // Only allow deleting your own conversations
    if (userId && conv.userId && conv.userId !== userId) {
      res.status(403).json({ error: "Interdit" });
      return;
    }
    await db.delete(conversations).where(eq(conversations.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// GET /anthropic/conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res) => {
  const parsed = ListAnthropicMessagesParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parsed.data.id))
      .orderBy(messages.createdAt);
    res.json(
      msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        images: (m as { images?: string[] | null }).images ?? undefined,
        createdAt: m.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to list messages" });
  }
});

// POST /anthropic/conversations/:id/messages/manual — insert a preformatted assistant
// message directly (no AI call). Used e.g. by the GitHub import feature to drop an
// imported site's HTML straight into the conversation/preview.
router.post("/conversations/:id/messages/manual", async (req, res) => {
  const parsed = ListAnthropicMessagesParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const { content } = req.body;
  if (!content || typeof content !== "string") { res.status(400).json({ error: "content requis" }); return; }
  // role optionnel ("user" | "assistant", defaut assistant) — permet au mode
  // Multi-Agents de persister aussi le prompt utilisateur.
  const role = req.body.role === "user" ? "user" : "assistant";
  try {
    const [msg] = await db.insert(messages).values({
      conversationId: parsed.data.id,
      role,
      content,
    }).returning();
    res.status(201).json({
      id: msg.id,
      conversationId: msg.conversationId,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("manual message insert error:", err);
    res.status(500).json({ error: "Échec de l'insertion du message" });
  }
});

// POST /anthropic/conversations/:id/messages  (SSE stream)
router.post("/conversations/:id/messages", async (req, res) => {
  const paramsParsed = SendAnthropicMessageParams.safeParse({
    id: Number(req.params.id),
  });
  const bodyParsed = SendAnthropicMessageBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const conversationId = paramsParsed.data.id;
  const userContent = bodyParsed.data.content;
  // Multi-photos : imageDatas[] (jusqu'a 4) avec repli sur l'ancien champ imageData
  const rawImageDatas = (req.body as { imageDatas?: unknown }).imageDatas;
  const rawImageMimes = (req.body as { imageMimes?: unknown }).imageMimes;
  const imageDatas: string[] = Array.isArray(rawImageDatas)
    ? rawImageDatas.filter((s): s is string => typeof s === "string" && s.length > 0).slice(0, 4)
    : (bodyParsed.data.imageData ? [bodyParsed.data.imageData] : []);
  const imageMimes: string[] = Array.isArray(rawImageMimes)
    ? rawImageMimes.filter((s): s is string => typeof s === "string").slice(0, 4)
    : [];
  const imageData = imageDatas[0];
  const imageMimeType = (bodyParsed.data.imageMimeType ?? "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";
  const userId = getUserId(req);
  const modelChoice = bodyParsed.data.model ?? "haiku";
  const agentMode = bodyParsed.data.agentMode;

  // Check plan — free users limited to haiku (fast) model
  const [currentUser] = userId
    ? await db.select({ plan: users.plan, email: users.email }).from(users).where(eq(users.id, userId))
    : [];
  // L'admin (ADMIN_EMAIL) a un accès complet : modèles premium + aucun quota
  const CHAT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const isAdminUser = !!(CHAT_ADMIN_EMAIL && currentUser?.email && currentUser.email.toLowerCase().trim() === CHAT_ADMIN_EMAIL);
  const isPaidUser = currentUser && (currentUser.plan !== "gratuit" || isAdminUser);

  // Mode hors ligne : seul l'admin peut utiliser le chat (GRADO_OFFLINE=1 pour fermer)
  const GRADO_OFFLINE = (process.env.GRADO_OFFLINE ?? "0") !== "0";
  if (GRADO_OFFLINE && !isAdminUser) {
    res.status(403).json({ error: "🚀 Grado arrive très bientôt ! L'accès n'est pas encore ouvert au public." });
    return;
  }

  // Sonnet (le modèle le plus coûteux) est réservé aux plans Créateur et plus
  const canUseSonnet = isAdminUser || !!(currentUser && ["createur", "fusion", "elite"].includes(currentUser.plan));

  // Quota mensuel de créations, appliqué à TOUS les plans (vidéo = 3 créations, reste = 1).
  // Voir lib/quota.ts pour les limites par plan (gratuit: 5, essentiel: 30, createur: 150, fusion: 500, elite: illimité).
  let freeQuotaReached = false;
  if (!isAdminUser && userId && currentUser) {
    try {
      const { getMonthlyQuotaStatus, PLAN_LIMITS } = await import("../../lib/quota.js");
      const status = await getMonthlyQuotaStatus(userId, currentUser.plan);
      if (status.reached) {
        freeQuotaReached = true;
        const limit = PLAN_LIMITS[currentUser.plan] ?? null;
        // Envoyer l'email seulement quand la limite vient d'être atteinte (pas à chaque message suivant)
        if (status.used === limit && currentUser.email) {
          const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId!)).limit(1);
          sendQuotaReachedEmail(currentUser.email, u?.name ?? "toi", "creations").catch(() => {});
        }
      }
    } catch (quotaErr) {
      console.error("creations quota check error:", quotaErr);
    }
  }

  // Models: haiku/sonnet via Anthropic (direct or Replit proxy), gemini/mistral/llama via OpenRouter
  const ANTHROPIC_MODELS: Record<string, string> = {
    haiku: "claude-haiku-4-5",
    sonnet: "claude-sonnet-4-5",
  };
  const OPENROUTER_MODELS: Record<string, string> = {
    gemini: "google/gemini-2.0-flash-001",
    mistral: "liquid/lfm-2.5-1.2b-instruct:free",
    llama: "meta-llama/llama-3.3-70b-instruct:free",
  };

  const FREE_FALLBACK_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "openai/gpt-oss-20b:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
  ];
  // Modèles OpenRouter gratuits ET compatibles vision — utilisés uniquement quand une image
  // est jointe. Les modèles de FREE_FALLBACK_MODELS ci-dessus ne comprennent pas les images.
  const FREE_VISION_FALLBACK_MODELS = [
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "google/gemma-4-31b-it:free",
  ];

  // No Anthropic key available (neither Replit AI integration nor a direct key) — fall back
  // to Gemini/OpenRouter for everyone, not just free users, so chat still works.
  const hasAnthropicKey = !!(
    (process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY && process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) ||
    process.env.ANTHROPIC_API_KEY ||
    process.env["CLÉ_ANTHROPIC"] ||
    process.env.CLE_ANTHROPIC ||
    process.env.ANTHROPIC_KEY
  );

  const isOpenRouterModel = modelChoice in OPENROUTER_MODELS;
  // Free users get a free OpenRouter model for now (premium models arrive soon); vision requires sonnet (multimodal)
  // Lecture de photos : Sonnet (Anthropic) uniquement pour les plans payants.
  // Les comptes gratuits passent par la chaine vision gratuite Gemini/OpenRouter
  // (voir FREE_VISION_FALLBACK_MODELS) — la lecture d'images reste donc
  // GRATUITE pour l'utilisateur et sans cout Anthropic.
  const selectedModel = imageData && isPaidUser && hasAnthropicKey
    ? "claude-sonnet-4-5"
    : !isPaidUser || !hasAnthropicKey
      ? OPENROUTER_MODELS["mistral"]
      : isOpenRouterModel
        ? OPENROUTER_MODELS[modelChoice]
        : (modelChoice === "sonnet" && !canUseSonnet
            ? "claude-haiku-4-5"
            : ANTHROPIC_MODELS[modelChoice] ?? "claude-haiku-4-5");

  const AGENT_PREFIXES: Record<string, string> = {
    dev: "Tu es un agent de développement expert. Priorité absolue: générer du code complet, fonctionnel et optimisé.\n\n",
    design: "Tu es un agent de design UI/UX expert. Priorité absolue: créer des interfaces belles, modernes et professionnelles avec des animations soignées.\n\n",
    analyse: "Tu es un agent d'analyse de données expert. Priorité absolue: analyser, visualiser et expliquer les données clairement avec Chart.js ou D3.\n\n",
    tutor: "Tu es un tuteur pédagogique expert. Priorité absolue: expliquer clairement, donner des exemples concrets et créer des supports éducatifs interactifs.\n\n",
    general: "",
    writer: `Tu es un expert en rédaction et en écriture créative. Ton rôle :
- Rédiger des articles longs, essays, billets de blog, scripts, lettres, rapports
- Structure claire : introduction accrocheuse, développement argumenté, conclusion percutante
- Adapter le ton (formel, casual, persuasif, académique) selon la demande
- Utiliser des titres, sous-titres, listes et mise en forme markdown
- Produire un contenu complet et professionnel, jamais tronqué
Réponds TOUJOURS dans la langue de l'utilisateur.\n\n`,
    translate: `Tu es un expert en traduction, linguistique et grammaire. Ton rôle :
- Traduire avec précision et naturel entre toutes les langues
- Corriger les fautes de grammaire, conjugaison, orthographe
- Expliquer les règles grammaticales avec des exemples
- Adapter le registre (formel/informel) selon le contexte
- Pour les traductions, afficher clairement l'original puis la traduction
- Signaler les nuances culturelles importantes
Réponds dans la langue demandée ou celle de l'utilisateur.\n\n`,
    philosophy: `Tu es un expert polyvalent en sciences humaines et exactes. Domaines de prédilection :
- Philosophie : Platon, Kant, Nietzsche, Camus, Sartre, stoïcisme, éthique, épistémologie
- Histoire : civilisations, guerres, révolutions, personnages historiques, chronologies
- Droit : principes juridiques, droits fondamentaux, procédures (toujours conseiller un avocat pour les cas spécifiques)
- Santé & médecine : symptômes, maladies, traitements courants (toujours recommander un médecin pour le diagnostic)
- Sciences : physique, mathématiques, biologie, astronomie
- Économie, psychologie, sociologie
Donne des réponses COMPLÈTES, DÉTAILLÉES et STRUCTURÉES avec des exemples concrets.
Utilise des titres markdown, des listes numérotées, des tableaux comparatifs si utile.
Réponds TOUJOURS dans la langue de l'utilisateur.\n\n`,
    casual: `Tu es un ami intelligent et cultivé. Ton style :
- Naturel, chaleureux et détendu — comme une vraie conversation
- Humour subtil et bonne humeur sans être forcé
- Curieux et à l'écoute — pose des questions de suivi si pertinent
- Pas de formalités excessives, pas de listes à rallonge sauf si vraiment utile
- Réponses adaptées à la longueur de la question (court si question courte)
- Parle comme la personne te parle — même registre, même langue
Sois authentique, pas robotique.\n\n`,
  };
  const systemPrefix = agentMode ? (AGENT_PREFIXES[agentMode] ?? "") : "";
  const effectiveSystem = systemPrefix + SYSTEM_PROMPT;

  let fullResponse = "";
  const safeWrite = (payload: string) => {
    if (res.destroyed || res.writableEnded) return;
    try { res.write(payload); } catch { /* client déconnecté — on continue en arrière-plan */ }
  };
  try {
    // Verify conversation exists
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Load user settings (memory + custom instructions) in parallel with message save
    const [, userSettingsRow] = await Promise.all([
      db.insert(messages).values({
        conversationId,
        role: "user",
        content: userContent,
        images: imageDatas.length
          ? imageDatas.map((d, i) => `data:${imageMimes[i] ?? imageMimeType};base64,${d}`)
          : null,
      }),
      userId
        ? db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1).then(r => r[0] ?? null)
        : Promise.resolve(null),
    ]);

    // Build dynamic system prompt with memory + custom instructions
    let dynamicPrefix = "";
    if (freeQuotaReached) {
      dynamicPrefix += `[MODE QUOTA ATTEINT — LIS ATTENTIVEMENT]:
Cet utilisateur a épuisé ses créations du mois (plan : ${currentUser?.plan ?? "gratuit"}).

✅ CE QUE TU DOIS FAIRE — TOUJOURS :
- Répondre à TOUTES les questions de conversation, conseil, explication, traduction, math, science, histoire, santé, business, etc. comme d'habitude — sans restriction.
- Être chaleureux, utile, et complet dans tes réponses textuelles.
- Si l'utilisateur demande une création (app, site, jeu, image, musique, vidéo), lui expliquer en 2-3 phrases sympas que son quota mensuel est atteint et l'inviter à upgrader sur /pricing pour continuer à créer.

❌ CE QUE TU NE DOIS PAS FAIRE :
- Générer du code HTML (pas de \`\`\`html, pas de <!DOCTYPE>)
- Générer des blocs de code complets (pas de \`\`\`python, \`\`\`js, etc.)
- Utiliser les tags [GRADO_IMAGE: ...] ou [GRADO_VIDEO: ...]

⚠️ SI L'UTILISATEUR DEMANDE POURQUOI SON SITE / APERÇU A DISPARU OU NE S'AFFICHE PLUS :
Réponds HONNÊTEMENT et UNIQUEMENT ceci : la génération est en pause car son quota mensuel est atteint ; ses créations précédentes ne sont pas perdues — elles restent accessibles via le bouton « 📁 Créations » au-dessus de l'aperçu, et il peut continuer à créer en passant sur un plan supérieur (/pricing).
N'INVENTE JAMAIS d'explication technique (CSS, display:none, JavaScript, navigateur, moteur de rendu…) — ce serait faux.

📷 LES PHOTOS RESTENT LISIBLES : analyser/décrire une image jointe ne compte pas dans le quota — continue à le faire normalement.

IMPORTANT : Tu restes un assistant IA complet. Tu réponds à tout — tu bloques uniquement la génération de fichiers créatifs.\n\n`;
    }
    if (!isPaidUser) {
      dynamicPrefix += `[INFO SYSTEME - a mentionner seulement si on te le demande]: Tu utilises la version gratuite de Grado. Le plan gratuit inclut : 5 créations/mois. La génération de vidéo n'est PAS disponible sur le plan gratuit — elle nécessite un plan payant (chaque vidéo coûte 3 créations sur le quota mensuel). Si on te demande la vidéo, explique que c'est réservé aux plans payants.\n\n`;
    }
    
    if (userSettingsRow?.memoryNotes?.trim()) {
      dynamicPrefix += `[MÉMOIRE UTILISATEUR — faits importants à toujours garder en tête]:\n${userSettingsRow.memoryNotes.trim()}\n\n`;
    }
    if (userSettingsRow?.customInstructions?.trim()) {
      dynamicPrefix += `[INSTRUCTIONS PERSONNALISÉES DE L'UTILISATEUR — respecte-les absolument]:\n${userSettingsRow.customInstructions.trim()}\n\n`;
    }
    const finalSystem = dynamicPrefix + effectiveSystem;

    // Load full conversation history for context
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    const chatMessages: Array<{ role: "user" | "assistant"; content: any }> =
      history.slice(0, -1).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Build last user message – include image if provided
    if (imageData) {
      const placeholders = imageDatas.map((_, i) => `__USER_IMAGE_${i + 1}__`).join(", ");
      const enrichedText = `${userContent}\n\n[Note système: L'utilisateur a joint ${imageDatas.length} image(s). Si tu génères du HTML contenant ces images, utilise exactement ${placeholders} comme valeurs d'attribut src. Grado remplacera automatiquement ces placeholders par les vraies images avant l'affichage.]`;
      chatMessages.push({
        role: "user",
        content: [
          ...imageDatas.map((d, i) => ({
            type: "image",
            source: { type: "base64", media_type: (imageMimes[i] ?? imageMimeType), data: d },
          })),
          { type: "text", text: enrichedText },
        ],
      });
    } else {
      chatMessages.push({ role: "user", content: userContent });
    }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    fullResponse = "";
    // Sans clé Anthropic, on doit toujours passer par Gemini/OpenRouter — y compris quand une
    // image est jointe — sinon les photos ne sont jamais transmises au modèle (elles étaient
    // silencieusement perdues quand seul le chemin Anthropic était tenté).
    // Les comptes gratuits passent TOUJOURS par Gemini/OpenRouter, image jointe ou
    // pas (les candidats vision gratuits gerent les photos). Anthropic est reserve
    // aux plans payants.
    const useOpenRouter = !hasAnthropicKey || !isPaidUser || (!imageData && isOpenRouterModel);

    if (useOpenRouter) {
      // OpenRouter uses OpenAI-compatible API
      const openrouterKey = process.env.OPENROUTER_API_KEY || process.env["CLÉ_API_OPENROUTER"] || process.env.CLE_API_OPENROUTER;
      const geminiKey = process.env.GEMINI_API_KEY || process.env["Clé API GEMINI"] || process.env.CLE_API_GEMINI || process.env.GEMINI_KEY;
      if (!openrouterKey && !geminiKey) {
        safeWrite(`data: ${JSON.stringify({ error: "Aucune clé IA configurée (GEMINI_API_KEY ou OPENROUTER_API_KEY)" })}\n\n`);
        try { res.end(); } catch {}
        return;
      }
      
      // OpenRouter is OpenAI-compatible, use fetch directly for streaming
      // Agent gratuit : Gemini (Google, gratuit et puissant) en priorité, puis les modèles gratuits OpenRouter
      const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
      const OR_HEADERS: Record<string, string> = { "HTTP-Referer": "https://grado.app", "X-Title": "Grado AI" };
      type ChatCandidate = { url: string; key: string; model: string; extraHeaders?: Record<string, string> };
      const candidates: ChatCandidate[] = [];
      // Free users, or any user when no Anthropic key is configured, use the free Gemini/OpenRouter fallback chain
      if (!isPaidUser || !hasAnthropicKey) {
        if (geminiKey) {
          candidates.push({ url: GEMINI_CHAT_URL, key: geminiKey, model: process.env.GEMINI_MODEL || "gemini-flash-latest" });
        }
        if (openrouterKey) {
          if (imageData) {
            // Les modèles de FREE_FALLBACK_MODELS ne comprennent pas les images — on utilise
            // à la place des modèles gratuits OpenRouter récents avec support vision.
            for (const m of FREE_VISION_FALLBACK_MODELS) {
              candidates.push({ url: OPENROUTER_CHAT_URL, key: openrouterKey, model: m, extraHeaders: OR_HEADERS });
            }
          } else {
            for (const m of FREE_FALLBACK_MODELS) {
              candidates.push({ url: OPENROUTER_CHAT_URL, key: openrouterKey, model: m, extraHeaders: OR_HEADERS });
            }
          }
        }
      } else if (openrouterKey) {
        candidates.push({ url: OPENROUTER_CHAT_URL, key: openrouterKey, model: selectedModel, extraHeaders: OR_HEADERS });
      }
      if (imageData && candidates.length === 0) {
        safeWrite(`data: ${JSON.stringify({ error: "La reconnaissance d'image nécessite une clé GEMINI_API_KEY ou OPENROUTER_API_KEY configurée sur le serveur." })}\n\n`);
        try { res.end(); } catch {}
        return;
      }
      const MAX_CONTINUATIONS = 12;
      // Format OpenAI-compatible : convertit les blocs "image" (format Anthropic) en "image_url"
      // (format attendu par Gemini/OpenRouter). Sans cette conversion, l'image était sérialisée
      // en JSON brut dans le texte et jamais réellement "vue" par le modèle.
      const toOpenAIContent = (content: any) => {
        if (typeof content === "string") return content;
        if (Array.isArray(content)) {
          return content.map((block: any) => {
            if (block?.type === "image" && block.source?.type === "base64") {
              return {
                type: "image_url",
                image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` },
              };
            }
            if (block?.type === "text") return { type: "text", text: block.text };
            return block;
          });
        }
        return JSON.stringify(content);
      };
      const runningMessages = chatMessages.map((m: any) => ({
        role: m.role,
        content: toOpenAIContent(m.content),
      }));
      let round = 0;
      let gotAnyContent = false;
      let hitContinuationCap = false;
      while (round <= MAX_CONTINUATIONS) {
        let orRes: Response | null = null;
        let lastErrText = "";
        for (const candidate of candidates) {
          // Transient overload (503/429) is common on free-tier models — retry the same
          // candidate a couple of times with a short backoff before moving to the next one.
          const RETRIES = 3;
          for (let attemptNum = 0; attemptNum < RETRIES; attemptNum++) {
            try {
              const fetchAbort = new AbortController();
              const fetchTimeout = setTimeout(() => fetchAbort.abort(), 28_000); // 28s max par tentative
              let attempt: Response;
              try {
                attempt = await fetch(candidate.url, {
                  method: "POST",
                  signal: fetchAbort.signal,
                  headers: {
                    "Authorization": `Bearer ${candidate.key}`,
                    "Content-Type": "application/json",
                    ...(candidate.extraHeaders || {}),
                  },
                  body: JSON.stringify({
                    model: candidate.model,
                    max_tokens: candidate.url === GEMINI_CHAT_URL ? 32768 : 8192,
                    stream: true,
                    messages: [
                      { role: "system", content: finalSystem },
                      ...runningMessages,
                    ],
                  }),
                });
              } finally {
                clearTimeout(fetchTimeout);
              }
              if (attempt.ok && attempt.body) {
                orRes = attempt;
                break;
              }
              lastErrText = await attempt.text();
              const retriable = attempt.status === 503 || attempt.status === 429 || attempt.status >= 500;
              if (!retriable || attemptNum === RETRIES - 1) break;
            } catch (fetchErr) {
              lastErrText = String(fetchErr);
            }
            await new Promise((r) => setTimeout(r, 600 * (attemptNum + 1)));
          }
          if (orRes) break;
        }

        if (!orRes || !orRes.body) {
          if (!gotAnyContent) {
            safeWrite(`data: ${JSON.stringify({ error: isCreditOrQuotaError(lastErrText) ? CREDIT_ERROR_MESSAGE : `OpenRouter error: ${lastErrText}` })}\n\n`);
            try { res.end(); } catch {}
            return;
          }
          break; // continuation attempt failed but we already have partial content — serve what we have
        }

        const reader = orRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let roundText = "";
        let finishReason = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                roundText += delta;
                fullResponse += delta;
                gotAnyContent = true;
                safeWrite(`data: ${JSON.stringify({ content: delta })}\n\n`);
              }
              const fr = parsed.choices?.[0]?.finish_reason;
              if (fr) finishReason = fr;
            } catch {}
          }
        }

        // Réponse tronquée car la limite de tokens a été atteinte : on continue automatiquement
        // pour éviter que le chat/la génération de code ne se coupe en plein milieu.
        if (finishReason === "length" && roundText.trim()) {
          if (round === MAX_CONTINUATIONS) {
            hitContinuationCap = true;
            break;
          }
          runningMessages.push({ role: "assistant", content: roundText });
          runningMessages.push({
            role: "user",
            content: "Continue exactement là où tu t'es arrêté, sans rien répéter de ce que tu as déjà écrit et sans réintroduction.",
          });
          round++;
          continue;
        }
        break;
      }
      // On a épuisé le budget de continuations automatiques mais la réponse est encore
      // tronquée : on le signale au frontend pour qu'il relance une suite automatiquement
      // au lieu de laisser le message coupé sans explication.
      if (hitContinuationCap) {
        safeWrite(`data: ${JSON.stringify({ truncated: true })}\n\n`);
      }
    } else {
      // Anthropic (direct key or Replit proxy)
      try {
        const MAX_CONTINUATIONS = 12;
        const runningAnthropicMessages: Array<{ role: "user" | "assistant"; content: any }> = [...chatMessages];
        let round = 0;
        let hitContinuationCap = false;
        while (round <= MAX_CONTINUATIONS) {
          const stream = anthropic.messages.stream({
            model: selectedModel,
            max_tokens: 8192,
            system: finalSystem,
            messages: runningAnthropicMessages,
          });

          let roundText = "";
          let stopReason: string | null = null;
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              roundText += event.delta.text;
              fullResponse += event.delta.text;
              safeWrite(
                `data: ${JSON.stringify({ content: event.delta.text })}\n\n`
              );
            } else if (event.type === "message_delta") {
              stopReason = (event.delta as any)?.stop_reason ?? stopReason;
            }
          }

          // Réponse tronquée car la limite de tokens a été atteinte : on continue automatiquement
          // pour éviter que le chat/la génération de code ne se coupe en plein milieu.
          if (stopReason === "max_tokens" && roundText.trim()) {
            if (round === MAX_CONTINUATIONS) {
              hitContinuationCap = true;
              break;
            }
            runningAnthropicMessages.push({ role: "assistant", content: roundText });
            runningAnthropicMessages.push({
              role: "user",
              content: "Continue exactement là où tu t'es arrêté, sans rien répéter de ce que tu as déjà écrit et sans réintroduction.",
            });
            round++;
            continue;
          }
          break;
        }
        if (hitContinuationCap) {
          safeWrite(`data: ${JSON.stringify({ truncated: true })}\n\n`);
        }
      } catch (anthropicErr) {
        console.error("Anthropic failed, falling back to OpenRouter:", anthropicErr);
        const openrouterKey = process.env.OPENROUTER_API_KEY || process.env["CLÉ_API_OPENROUTER"] || process.env.CLE_API_OPENROUTER;
        const geminiKeyFallback = process.env.GEMINI_API_KEY || process.env["Clé API GEMINI"] || process.env.CLE_API_GEMINI || process.env.GEMINI_KEY;
        // Si une image est jointe et qu'Anthropic échoue, Gemini (vision) est le seul repli
        // viable — les modèles gratuits OpenRouter de FREE_FALLBACK_MODELS ne supportent pas les images.
        if (imageData && geminiKeyFallback) {
          try {
            const toOpenAIContentFallback = (content: any) => {
              if (typeof content === "string") return content;
              if (Array.isArray(content)) {
                return content.map((block: any) => {
                  if (block?.type === "image" && block.source?.type === "base64") {
                    return { type: "image_url", image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } };
                  }
                  if (block?.type === "text") return { type: "text", text: block.text };
                  return block;
                });
              }
              return JSON.stringify(content);
            };
            const attempt = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${geminiKeyFallback}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: process.env.GEMINI_MODEL || "gemini-flash-latest",
                max_tokens: 32768,
                stream: true,
                messages: [
                  { role: "system", content: finalSystem },
                  ...chatMessages.map((m: any) => ({ role: m.role, content: toOpenAIContentFallback(m.content) })),
                ],
              }),
            });
            if (attempt.ok && attempt.body) {
              const reader3 = attempt.body.getReader();
              const decoder3 = new TextDecoder();
              let buffer3 = "";
              while (true) {
                const { done, value } = await reader3.read();
                if (done) break;
                buffer3 += decoder3.decode(value, { stream: true });
                const lines3 = buffer3.split("\n");
                buffer3 = lines3.pop() ?? "";
                for (const line of lines3) {
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") continue;
                  try {
                    const parsedLine = JSON.parse(data);
                    const delta = parsedLine.choices?.[0]?.delta?.content;
                    if (delta) {
                      fullResponse += delta;
                      safeWrite(`data: ${JSON.stringify({ content: delta })}\n\n`);
                    }
                  } catch {}
                }
              }
            }
          } catch {}
        }
        // Si Gemini n'a pas donné de réponse (pas de clé, ou lui aussi en erreur), on tente
        // les modèles vision gratuits d'OpenRouter avant d'abandonner.
        if (!fullResponse && openrouterKey) {
          const toOpenAIContentOR = (content: any) => {
            if (typeof content === "string") return content;
            if (Array.isArray(content)) {
              return content.map((block: any) => {
                if (block?.type === "image" && block.source?.type === "base64") {
                  return { type: "image_url", image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } };
                }
                if (block?.type === "text") return { type: "text", text: block.text };
                return block;
              });
            }
            return JSON.stringify(content);
          };
          const candidateModels = imageData ? FREE_VISION_FALLBACK_MODELS : FREE_FALLBACK_MODELS;
          for (const candidateModel of candidateModels) {
            try {
              const attempt = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${openrouterKey}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": "https://grado.app",
                  "X-Title": "Grado AI",
                },
                body: JSON.stringify({
                  model: candidateModel,
                  max_tokens: 8192,
                  stream: true,
                  messages: [
                    { role: "system", content: finalSystem },
                    ...chatMessages.map((m: any) => ({
                      role: m.role,
                      content: imageData ? toOpenAIContentOR(m.content) : (typeof m.content === "string" ? m.content : JSON.stringify(m.content)),
                    })),
                  ],
                }),
              });
              if (attempt.ok && attempt.body) {
                const reader2 = attempt.body.getReader();
                const decoder2 = new TextDecoder();
                let buffer2 = "";
                while (true) {
                  const { done, value } = await reader2.read();
                  if (done) break;
                  buffer2 += decoder2.decode(value, { stream: true });
                  const lines2 = buffer2.split("\n");
                  buffer2 = lines2.pop() ?? "";
                  for (const line of lines2) {
                    if (!line.startsWith("data: ")) continue;
                    const data = line.slice(6).trim();
                    if (data === "[DONE]") continue;
                    try {
                      const parsedLine = JSON.parse(data);
                      const delta = parsedLine.choices?.[0]?.delta?.content;
                      if (delta) {
                        fullResponse += delta;
                        safeWrite(`data: ${JSON.stringify({ content: delta })}\n\n`);
                      }
                    } catch {}
                  }
                }
                break;
              }
            } catch {}
          }
        }
        if (!fullResponse) {
          const anthropicErrText = String((anthropicErr as any)?.message ?? anthropicErr ?? "");
          safeWrite(`data: ${JSON.stringify({ error: isCreditOrQuotaError(anthropicErrText) ? CREDIT_ERROR_MESSAGE : "Le service premium est temporairement indisponible. Réessaie dans un instant." })}\n\n`);
        }
      }
        }

    // Save assistant message
    await db.insert(messages).values({
      conversationId,
      role: "assistant",
      content: fullResponse,
    });

    safeWrite(`data: ${JSON.stringify({ done: true })}\n\n`);
    try { res.end(); } catch {}
  } catch (err) {
    console.error("Streaming error:", err);
    // Sauvegarder quand même ce qui a été généré (ex: utilisateur parti en cours de génération)
    if (fullResponse) {
      try {
        await db.insert(messages).values({ conversationId, role: "assistant", content: fullResponse });
      } catch (saveErr) {
        console.error("save-after-disconnect error:", saveErr);
      }
    }
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream response" });
    } else {
      safeWrite(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
      try { res.end(); } catch {}
    }
  }
});

export default router;
